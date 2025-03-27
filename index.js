require("dotenv").config(); // Load environment variables
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const tradingWisdom = require("./quotes");
const schedule = require("node-schedule");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// replace the channel IDs with your own
const channelIds = ["1337209276661239860", "1334610731487858900"];

// Function to send a random trading wisdom
function sendRandomWisdom(channel) {
  try {
    const randomQuote =
      tradingWisdom[Math.floor(Math.random() * tradingWisdom.length)];
    const embed = new EmbedBuilder()
      .setTitle("Trading Wisdom 💡")
      .setDescription("## *" + randomQuote + "*")
      .setColor("#00FF00");

    channel.send({ embeds: [embed] });
    console.log(`Sent message: ${randomQuote}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Function to schedule daily messages
function scheduleDailyMessage() {
  // Existing job for trading wisdom
  schedule.scheduleJob({ hour: 9, minute: 58, tz: "America/New_York" }, () => {
    channelIds.forEach((channelId) => {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        sendRandomWisdom(channel);
      } else {
        console.error(`Channel with ID ${channelId} not found`);
      }
    });
  });
  console.log("Scheduled daily trading wisdom messages at 9:58 am EST");

  // New job for the welcome message
  const welcomeChannelId = "1334610731487858900"; // channel ID
  schedule.scheduleJob({ hour: 9, minute: 15, tz: "America/New_York" }, () => {
    const channel = client.channels.cache.get(welcomeChannelId);
    if (channel) {
      const welcomeMessage = `**Good morning and welcome @everyone!** :wave:  

Take your time to explore the **trade alerts**—no need to feel overwhelmed by the volume.
Focus on understanding them at your own pace.  

Be sure to check **\`Read Me First\`** for the best experience!`;

      channel.send(welcomeMessage);
      console.log("Sent daily welcome message.");
    } else {
      console.error(`Channel with ID ${welcomeChannelId} not found`);
    }
  });
  console.log("Scheduled daily welcome message at 9:15 am EST");
}

// Bot ready event
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  scheduleDailyMessage();
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

  // !setinterval command
  if (message.content.startsWith("!setinterval")) {
    const timeString = message.content.split(" ")[1]; // Get the time argument
    if (!timeString) {
      message.reply(
        "Usage: `!setinterval <time>` (e.g., `!setinterval 1h`, `!setinterval 30m`, `!setinterval 10s`)"
      );
      return;
    }

    // Parse the time string
    const timeUnit = timeString.slice(-1); // Get the last character (h, m, s)
    const timeValue = parseInt(timeString.slice(0, -1)); // Get the numeric value

    if (isNaN(timeValue)) {
      message.reply(
        "Invalid time format. Use `!setinterval <time>` (e.g., `!setinterval 1h`, `!setinterval 30m`, `!setinterval 10s`)"
      );
      return;
    }

    // Convert to milliseconds
    let messageInterval;
    switch (timeUnit) {
      case "h":
        messageInterval = timeValue * 60 * 60 * 1000;
        break;
      case "m":
        messageInterval = timeValue * 60 * 1000;
        break;
      case "s":
        messageInterval = timeValue * 1000;
        break;
      default:
        message.reply(
          "Invalid time unit. Use `h` for hours, `m` for minutes, or `s` for seconds."
        );
        return;
    }

    // Restart the interval with the new time
    startInterval(message.channel);
    message.reply(`Interval set to ${timeString}`);
  }

  // !addquote command
  if (message.content.startsWith("!addquote")) {
    const quote = message.content.slice("!addquote ".length).trim();
    if (!quote) {
      message.reply("Usage: `!addquote <quote>`");
      return;
    }

    tradingWisdom.push(quote);
    message.reply(`Added quote: ${quote}`);
    console.log(`Added quote: ${quote}`);
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

    if (index >= tradingWisdom.length) {
      message.reply("Invalid index. No quote found at that position.");
      return;
    }

    const removedQuote = tradingWisdom.splice(index, 1)[0];
    message.reply(`Removed quote: "${removedQuote}"`);
    console.log(`Removed quote: "${removedQuote}"`);
  }

  // !listquotes command
  if (message.content === "!listquotes") {
    const quotesList = tradingWisdom
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
      .setTitle("Bot Commands")
      .setDescription("Here are all the available commands:")
      .addFields(
        { name: "!wisdom", value: "Sends a random trading wisdom message." },
        {
          name: "!setinterval <time>",
          value:
            "Sets the interval for automatic messages (e.g., `!setinterval 1h`, `!setinterval 30m`, `!setinterval 10s`).",
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
