## logseq-on-this-day

Review previous journals on this day.

### Features

* List all journals created on this day in one page

### Demo

![Demo](./demo.gif)

### How to enable this plugin

Since this plugin hasn't been accepted by Logseq yet, please enable developer mode to use this plugin

1. clone this repo to your local disk `git clone https://github.com/imrickysu/logseq-on-this-day`
2. Compile the plugin with `yarn && yarn build` (You need to install nvm, npm, yarn, etc.)
3. Enable Logseq developer mode: Settings -> Advanced -> Developer Mode: Enable
4. Add the plugin path: Settings -> Plugins -> Load unpacked plugin

Once the plugin is loaded, you can click the plugin button on the top icon bar, pin the "on-this-day" icon to the toolbar. Clicking the monument button will generate the On This Day page if it doesn't exist, or refresh it if it exists.

### Customize the plugin

On the plugin settings page, you can customize the following settings for this plugin by selecting Settings -> Plugins -> logseq-on-this-day.

* startingYear: Specify the starting year you wish to view on the On This Day page (till now). Journals before this year will be skipped.
* pageTitle: You can customize the page title. It's valid to use non-English characters.
