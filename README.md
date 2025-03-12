# Trade Sage

Trade Sage is a Discord bot designed to provide trading wisdom and insights to users. The bot sends random trading quotes to specified channels and allows administrators to manage quotes and message intervals.

## Features

- Sends random trading wisdom quotes to specified Discord channels.
- Allows administrators to add, remove, and list quotes.
- Supports setting custom intervals for automatic messages.
- Provides a help command to list all available commands.

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/trade-sage.git
   cd trade-sage
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Discord bot token and client ID:

   ```properties
   DISCORD_TOKEN=your-discord-bot-token
   DISCORD_CLIENT_ID=your-discord-client-id
   ```

## Usage

1. Start the bot:

   ```sh
   node index.js
   ```

2. Invite the bot to your Discord server using the client ID.

## Commands

- `!wisdom`: Sends a random trading wisdom message.
- `!setinterval <time>`: Sets the interval for automatic messages (e.g., `!setinterval 1h`, `!setinterval 30m`, `!setinterval 10s`).
- `!addquote <quote>`: Adds a new trading wisdom quote.
- `!removequote <index>`: Removes a quote by its index (first 5 quotes cannot be removed).
- `!listquotes`: Displays all quotes with their index.
- `!help`: Displays the help message with all available commands.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## License

This project is licensed under the ISC License.
