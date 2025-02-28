require("dotenv").config(); // Load environment variables
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs"); // For reading/writing JSON file
const tradingWisdom = require("./quotes"); // Initial quotes

// File to store persistent data
const dataFilePath = "./data.json";

// Load data from file (if it exists)
let channelSettings = new Map();
let quotes = [...tradingWisdom]; // Start with initial quotes

if (fs.existsSync(dataFilePath)) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
  channelSettings = new Map(data.channelSettings);
  quotes = data.tradingWisdom;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Function to save data to JSON file
function saveData() {
  const data = {
    channelSettings: Array.from(channelSettings.entries()),
    tradingWisdom: quotes,
  };
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  console.log("Data saved to data.json");
}

// Function to send a random trading wisdom
function sendRandomWisdom(channel) {
  try {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const embed = new EmbedBuilder()
      .setTitle("Trading Wisdom 💡")
      .setDescription("## " + randomQuote)
      .setColor("#00FF00");

    channel.send({ embeds: [embed] });
    console.log(`Sent message to ${channel.id}: ${randomQuote}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Function to start the interval for a specific channel
function startInterval(channelId, interval) {
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error(`Channel ${channelId} not found.`);
    return;
  }

  // Clear existing interval if it exists
  if (channelSettings.has(channelId)) {
    clearInterval(channelSettings.get(channelId).intervalId);
  }

  // Start a new interval
  const intervalId = setInterval(() => sendRandomWisdom(channel), interval);
  channelSettings.set(channelId, { interval, intervalId });

  console.log(
    `Interval set for channel ${channelId}: ${interval / 1000} seconds`
  );
  saveData(); // Save updated channel settings
}

// Bot ready event
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Start intervals for all saved channels
  for (const [channelId, settings] of channelSettings.entries()) {
    startInterval(channelId, settings.interval);
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Command handling
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore messages from other bots

  // Check if the user has the "Admin" role
  const isAdmin = message.member.roles.cache.some(
    (role) => role.name === "Admin"
  );

  if (!isAdmin) return; // Ignore non-admin users

  // !wisdom command
  if (message.content === "!wisdom") {
    console.log("Admin triggered !wisdom command");
    sendRandomWisdom(message.channel);
  }

  // !setchannel command
  if (message.content.startsWith("!setchannel")) {
    const channelId = message.content.split(" ")[1];
    if (!channelId) {
      message.reply("Usage: `!setchannel <channelID>`");
      return;
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      message.reply("Invalid channel ID. Please provide a valid channel ID.");
      return;
    }

    // Initialize settings for the channel
    if (!channelSettings.has(channelId)) {
      channelSettings.set(channelId, {
        interval: 24 * 60 * 60 * 1000,
        intervalId: null,
      }); // Default interval: 24 hours
      startInterval(channelId, 24 * 60 * 60 * 1000); // Start the interval
    }

    message.reply(`Channel set to <#${channelId}>. Quotes will be sent here.`);
  }

  // !setinterval command
  if (message.content.startsWith("!setinterval")) {
    const args = message.content.split(" ");
    if (args.length < 3) {
      message.reply(
        "Usage: `!setinterval <time> <channelID>` (e.g., `!setinterval 1h 123456789012345678`)"
      );
      return;
    }

    const timeString = args[1];
    const channelId = args[2];

    // Parse the time string
    const timeUnit = timeString.slice(-1); // Get the last character (h, m, s)
    const timeValue = parseInt(timeString.slice(0, -1)); // Get the numeric value

    if (isNaN(timeValue)) {
      message.reply(
        "Invalid time format. Use `h` for hours, `m` for minutes, or `s` for seconds."
      );
      return;
    }

    // Convert to milliseconds
    let interval;
    switch (timeUnit) {
      case "h":
        interval = timeValue * 60 * 60 * 1000;
        break;
      case "m":
        interval = timeValue * 60 * 1000;
        break;
      case "s":
        interval = timeValue * 1000;
        break;
      default:
        message.reply(
          "Invalid time unit. Use `h` for hours, `m` for minutes, or `s` for seconds."
        );
        return;
    }

    // Update the interval for the channel
    if (!channelSettings.has(channelId)) {
      message.reply("Channel not set. Use `!setchannel <channelID>` first.");
      return;
    }

    startInterval(channelId, interval);
    message.reply(`Interval set to ${timeString} for <#${channelId}>.`);
  }

  // !addquote command
  if (message.content.startsWith("!addquote")) {
    const quote = message.content.slice("!addquote ".length).trim();
    if (!quote) {
      message.reply("Usage: `!addquote <quote>`");
      return;
    }

    quotes.push(quote);
    message.reply(`Added quote: ${quote}`);
    console.log(`Added quote: ${quote}`);
    saveData(); // Save updated quotes
  }

  // !removequote command
  if (message.content.startsWith("!removequote")) {
    const index = parseInt(message.content.split(" ")[1]);
    if (isNaN(index)) {
      message.reply("Usage: `!removequote <index>` (e.g., `!removequote 6`)");
      return;
    }

    if (index < 5) {
      message.reply("You cannot remove the first 5 default quotes.");
      return;
    }

    if (index >= quotes.length) {
      message.reply("Invalid index. No quote found at that position.");
      return;
    }

    const removedQuote = quotes.splice(index, 1)[0];
    message.reply(`Removed quote: "${removedQuote}"`);
    console.log(`Removed quote: "${removedQuote}"`);
    saveData(); // Save updated quotes
  }

  // !listquotes command
  if (message.content === "!listquotes") {
    const quotesList = quotes
      .map((quote, index) => `${index}. ${quote}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("List of Trading Wisdom Quotes")
      .setDescription(quotesList)
      .setColor("#00FF00");

    message.reply({ embeds: [embed] });
  }

  // !help command
  if (message.content === "!help") {
    const helpEmbed = new EmbedBuilder()
      .setTitle("Trade Sage Bot Commands")
      .setDescription("Here are all the available commands:")
      .addFields(
        { name: "!wisdom", value: "Sends a random trading wisdom message." },
        {
          name: "!setchannel <channelID>",
          value: "Sets the channel where quotes will be sent.",
        },
        {
          name: "!setinterval <time> <channelID>",
          value:
            "Sets the interval for automatic messages in a specific channel (e.g., `!setinterval 1h 123456789012345678`).",
        },
        {
          name: "!addquote <quote>",
          value: "Adds a new trading wisdom quote.",
        },
        {
          name: "!removequote <index>",
          value:
            "Removes a quote by its index (first 5 quotes cannot be removed).",
        },
        {
          name: "!listquotes",
          value: "Displays all quotes with their index.",
        },
        { name: "!help", value: "Displays this help message." }
      )
      .setColor("#00FF00");

    message.reply({ embeds: [helpEmbed] });
  }
});
