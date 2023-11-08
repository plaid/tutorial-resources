# iOS Starter App

### Overview

This is a starter app that is intended to be used with the Getting Started with iOS [YouTube tutorial](https://www.youtube.com/watch?v=9fgmW38usTo). It implements a very basic app that allows a user to connect to their bank via Plaid, and then makes a simple call to /auth/get to retrieve the user's routing number. This application uses Swift on the front end, and NodeJS/Express on the backend.

### Running the app

If you want the most complete instructions for running the app, please follow along with the video tutorial linked above. The following abbreviated instructions are for those of you who really don't want to watch videos.

#### Clone the repo

Clone the tutorial resources repo to your machine and cd into the project's start directory:

```bash
git clone https://github.com/plaid/tutorial-resources && cd ios/start
```

### Set up your server

The server is designed to be used with Node 16 or higher. For information on installing Node, see [How to install Node.js](https://nodejs.dev/learn/how-to-install-nodejs), and consider using [nvm](https://github.com/nvm-sh/nvm) to easily switch between Node versions.

#### Move into your server directory

```bash
cd server
```

#### Install dependencies

Install the necessary dependencies:

```bash
npm install
```

#### Add your credentials to the app

Copy the included **.env.template** to a file called **.env**.

```bash
cp .env.template .env
```

Fill out the contents of the **.env** file with the [client ID and secret in your Plaid dashboard](https://dashboard.plaid.com/team/keys). Make sure to pick the appropriate secret value for the environment you're using. (We recommend using sandbox to start.)

Also, add a user ID to represent the current "logged in" user.

#### Start the server

Start the app by running the following command:

```bash
npm run watch
```

The server will start running on port 8000 and will update whenever you make a change to the server files.

### Set up your client

- Open up `SamplePlaidClient.xcodeproj` in Xcode
- In the `SamplePlaidClient` target, change the bundle identifier to something appropriate for your organization
- That's it! You should be able to run your project in the simulator.
