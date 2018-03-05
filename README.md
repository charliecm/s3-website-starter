# S3 Website Starter

A simple boilerplate for creating a static website to deploy on an Amazon S3 bucket. This codebase uses [s3_website](https://github.com/laurilehmijoki/s3_website) for deployment, [EJS](http://ejs.co) for templating and [SASS (indented)](https://sass-lang.com) for generating the stylesheet.

## Development

Please install [node](https://nodejs.org), [Ruby](https://www.ruby-lang.org) and [Bundler](http://bundler.io) in your system. Then run the following:

	npm install
	bundle install

Run `npm run local` to watch files and start a local development server at `http://localhost:8081`. [Livereload](http://livereload.com) is enabled in this mode.

Run `npm run prod` to do the same as above, but with production-ready code.

## Deployment

This project is intended to be deployed to a Amazon S3 bucket. Please create an `.env` file at the root folder with the `S3_ID`, `S3_SECRET` and `S3_BUCKET` variables.

Run `npm run test` to do a dry run of the deploy.

Run `npm run deploy` to upload to the bucket.

*Note:* Remember to run `npm run prod` before deploying!

## Structure

`config.js` - Build-related variables.

`manifest.js` - Has a list of pages to be generated into the distribution folder, mapped to their respective template.

`src/templates/` - Template files in EJS.

`src/css` - SASS files to be compiled into CSS (styles.css).

`src/js` - JavaScript files.

`src/image` - Image files.

Files in `src/` (root) are automatically copied to the distribution folder.

## Template Snippets

### Include with data

	<%- include('name', {}) %>
