# Transactions

### Overview

This is a starter app that is to be used with the Getting Started with Plaid Transactions [YouTube tutorial](https://youtu.be/Pin0-ceDKcI). It implements a very basic personal finance app using `/transactions/sync` to retrieve and update the user's transaction data. This application uses HTML/VanillaJS on the front end, and NodeJS/Express on the backend, alongside a SQLite database.

### Running the app

If you want the most complete instructions for running the app, please follow along with the video tutorial linked above. The following abbreviated instructions are for those of you who really don't want to watch videos.

#### Clone the repo

Clone the tutorial resources repo to your machine and cd into the project's start directory:

```bash
git clone https://github.com/plaid/tutorial-resources && cd transactions/start
```

#### Set up your environment

This app is designed to be used with Node 16 or higher. For information on installing Node, see [How to install Node.js](https://nodejs.dev/learn/how-to-install-nodejs), and consider using [nvm](https://github.com/nvm-sh/nvm) to easily switch between Node versions.

#### Install dependencies

Install the necessary dependencies:

```bash
npm install
```

#### Equip the app with credentials

Copy the included **.env.template** to a file called **.env**.

```bash
cp .env.template .env
```

Fill out the contents of the **.env** file with the [client ID and secret in your Plaid dashboard](https://dashboard.plaid.com/team/keys). Make sure to pick the appropriate secret value for the environment you're using. (We recommend using sandbox to start.)

#### (Optional) Configure a webhook

This application also shows you how to make use of webhooks, so your application know when to fetch new transactions. If you wish to use this feature, you'll need to have your webhook server, which is running on port 8001, available to Plaid's server.

A common way to do this is to use a tool like ngrok. If you have ngrok installed, run the following command:

```bash
ngrok http 8001
```

And ngrok will open a tunnel from the outside world to port 8001 on your machine. Update the `WEBHOOK_URL` with the domain that ngrok has generated. Your final URL should look something like `https://abde-123-4-567-8.ngrok.io/server/receive_webhook`

See the [Plaid Webhooks Tutorial](https://www.youtube.com/watch?v=0E0KEAVeDyc) for a full description of webhooks and how they work.

#### Start the server

Start the app by running the following command:

```bash
npm run watch
```

The server will start running on port 8000 and will update whenever you make a change to the server files. To use the app, navigate to `localhost:8000` in your browser.

#### Problems?

On some occasions (usually if the app fails to start up properly the first time), you will end up in a state where the database file has been created, but none of the tables have been added. This usually manifests as a `SQLITE_ERROR: no such table: users` error. If you receive this error, you can fix it by deleting the `appdata.db` file in your `database` folder and then restarting the server.
