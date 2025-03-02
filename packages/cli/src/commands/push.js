/* eslint-disable no-await-in-loop */
/* eslint no-shadow: 0 */

require('@colors/colors');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { Command, flags } = require('@oclif/command');
const shelljs = require('shelljs');
const { glob } = require('glob');
const { cli } = require('cli-ux');
const { extractPhrases } = require('../api/extract');
const { uploadPhrases, pollJob } = require('../api/upload');
const { mergePayload } = require('../api/merge');
const { stringToArray } = require('../api/utils');

/**
 * Test if path is folder
 *
 * @param {String} path
 * @returns {Boolean}
 */
function isFolder(path) {
  try {
    const stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
}

class PushCommand extends Command {
  async run() {
    const { args, flags } = this.parse(PushCommand);
    const pwd = `${shelljs.pwd()}`;
    let filePattern = path.isAbsolute(args.pattern)
      ? args.pattern
      : path.join(pwd, args.pattern);

    if (isFolder(filePattern)) {
      filePattern = path.join(filePattern, PushCommand.args[0].default);
    }
    filePattern = filePattern.replace(/\\/g, '/');

    const appendTags = stringToArray(flags['append-tags']);
    const filterWithTags = stringToArray(flags['with-tags-only']);
    const filterWithoutTags = stringToArray(flags['without-tags-only']);
    const useHashedKeys = flags['key-generator'] === 'hash';

    this.log('Parsing all files to detect translatable content...');

    const allFiles = await new Promise((resolve, reject) => {
      glob(filePattern, (err, files) => {
        if (err) return reject(err);
        return resolve(files);
      });
    });

    let emptyFiles = 0;
    const errorFiles = [];
    const payload = {};
    const tree = {};

    const bar = cli.progress({
      format: '⸨{bar}⸩ {value}/{total} {file}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '⠂',
      stream: process.stdout,
    });
    bar.start(allFiles.length, 0);

    const extractOptions = {
      appendTags,
      filterWithTags,
      filterWithoutTags,
      useHashedKeys,
      parser: flags.parser,
    };

    _.each(allFiles, (file) => {
      const relativeFile = file.replace(pwd, '');
      bar.increment({ file: relativeFile.gray });
      try {
        const data = extractPhrases(file, relativeFile, extractOptions);
        tree[relativeFile] = data;
        if (_.isEmpty(data)) {
          emptyFiles += 1;
        } else {
          mergePayload(payload, data);
        }
      } catch (error) {
        errorFiles.push({
          file: relativeFile,
          error,
        });
      }
    });

    bar.stop();

    this.log([
      `${'✓'.green} Processed ${allFiles.length.toString().green} file(s) and found`,
      `${_.keys(payload).length.toString().green} translatable phrases.`,
    ].join(' '));

    this.log(`${'✓'.green} Content detected in ${(allFiles.length - emptyFiles).toString().green} file(s).`);

    if (flags.verbose) {
      _.each(tree, (data, file) => {
        if (_.isEmpty(data)) return;
        this.log(file.green);
        _.each(data, (value, key) => {
          if (key !== value.string) {
            this.log(`  └─ ${key}: ${value.string.underline}`);
          } else {
            this.log(`  └─ ${value.string.underline}`);
          }
          _.each(value.meta, (meta, metaKey) => {
            if ((_.isObject(meta) || _.isArray(meta)) && _.isEmpty(meta)) {
              return;
            }
            this.log(`    └─ ${metaKey}: ${JSON.stringify(meta)}`.gray);
          });
        });
      });
    }

    if (errorFiles.length) {
      this.log(`⚠ Failed to process ${errorFiles.length} file(s).`.yellow);
      if (flags.verbose) {
        _.each(errorFiles, ({ file, error }) => {
          this.log(`${'✘'.red} ${file}`);
          if (flags.verbose) {
            this.log(error.toString().red);
          }
        });
      }
    }

    if (!flags['dry-run']) {
      if (_.isEmpty(payload)) {
        this.log('⚠ Nothing to upload.'.yellow);
        process.exit();
      }

      let cdsHost = process.env.TRANSIFEX_CDS_HOST || 'https://cds.svc.transifex.net';
      let projectToken = process.env.TRANSIFEX_TOKEN;
      let projectSecret = process.env.TRANSIFEX_SECRET;

      if (flags.token) projectToken = flags.token;
      if (flags.secret) projectSecret = flags.secret;
      if (flags['cds-host']) cdsHost = flags['cds-host'];

      if (!projectToken || !projectSecret) {
        this.log(`${'✘'.red} Cannot push content, credentials are missing.`);
        this.log('Tip: Set TRANSIFEX_TOKEN and TRANSIFEX_SECRET environment variables'.yellow);
        process.exit();
      }

      const uploadMessage = 'Uploading content to Transifex';

      this.log('');
      cli.action.start(uploadMessage, '', { stdout: true });
      try {
        let res = await uploadPhrases(payload, {
          url: cdsHost,
          token: projectToken,
          secret: projectSecret,
          purge: flags.purge,
        });

        if (flags['no-wait']) {
          cli.action.stop('Queued'.green);
          return;
        }

        // poll for completion
        const jobUrl = `${cdsHost}${res.jobUrl}`;
        let status = '';
        do {
          await cli.wait(1500);
          res = await pollJob({
            url: jobUrl,
            token: projectToken,
            secret: projectSecret,
          });
          if (status !== res.status) {
            status = res.status;
            switch (status) {
              case 'pending':
                cli.action.start(uploadMessage, 'In queue', { stdout: true });
                break;
              case 'processing':
                cli.action.start(uploadMessage, 'Processing', { stdout: true });
                break;
              default:
                break;
            }
          }
        } while (status === 'pending' || status === 'processing');

        if (status === 'completed') {
          cli.action.stop('Success'.green);
          this.log(`${'✓'.green} Successfully pushed strings to Transifex:`);
          if (res.created > 0) {
            this.log(`  Created strings: ${res.created.toString().green}`);
          }
          if (res.updated > 0) {
            this.log(`  Updated strings: ${res.updated.toString().green}`);
          }
          if (res.skipped > 0) {
            this.log(`  Skipped strings: ${res.skipped.toString().green}`);
          }
          if (res.deleted > 0) {
            this.log(`  Deleted strings: ${res.deleted.toString().green}`);
          }
          if (res.failed > 0) {
            this.log(`  Failed strings: ${res.failed.toString().red}`);
          }
        } else {
          cli.action.stop('Failed'.red);
        }
        _.each(res.errors, (error) => {
          this.log(`Error: ${JSON.stringify(error).red}`);
        });
      } catch (err) {
        cli.action.stop('Failed'.red);
        this.error(err);
      }
    }
  }
}

PushCommand.description = `detect and push source content to Transifex
Parse .js, .ts, .jsx, .tsx and .html files and detect phrases marked for
translation by Transifex Native toolkit for Javascript and
upload them to Transifex for translation.

To push content some environment variables must be set:
TRANSIFEX_TOKEN=<Transifex Native Project Token>
TRANSIFEX_SECRET=<Transifex Native Project Secret>
(optional) TRANSIFEX_CDS_HOST=<CDS HOST>

or passed as --token=<TOKEN> --secret=<SECRET> parameters

Default CDS Host is https://cds.svc.transifex.net

Examples:
txjs-cli push -v
txjs-cli push src/
txjs-cli push /home/repo/src
txjs-cli push "*.js"
txjs-cli push --dry-run
txjs-cli push --no-wait
txjs-cli push --key-generator=hash
txjs-cli push --append-tags="master,release:2.5"
txjs-cli push --with-tags-only="home,error"
txjs-cli push --without-tags-only="custom"
txjs-cli push --token=mytoken --secret=mysecret
txjs-cli push en.json --parser=i18next
TRANSIFEX_TOKEN=mytoken TRANSIFEX_SECRET=mysecret txjs-cli push
`;

PushCommand.args = [{
  name: 'pattern',
  description: 'file pattern to scan for strings',
  default: '**/*.{js,jsx,ts,tsx,html,vue,pug,ejs}',
  required: false,
}];

PushCommand.flags = {
  'dry-run': flags.boolean({
    description: 'dry run, do not push to Transifex',
    default: false,
  }),
  verbose: flags.boolean({
    char: 'v',
    description: 'verbose output',
    default: false,
  }),
  purge: flags.boolean({
    description: 'purge content on Transifex',
    default: false,
  }),
  'no-wait': flags.boolean({
    description: 'disable polling for upload results',
    default: false,
  }),
  token: flags.string({
    description: 'native project public token',
    default: '',
  }),
  secret: flags.string({
    description: 'native project secret',
    default: '',
  }),
  'append-tags': flags.string({
    description: 'append tags to strings',
    default: '',
  }),
  'with-tags-only': flags.string({
    description: 'push strings with specific tags',
    default: '',
  }),
  'without-tags-only': flags.string({
    description: 'push strings without specific tags',
    default: '',
  }),
  'cds-host': flags.string({
    description: 'CDS host URL',
    default: '',
  }),
  parser: flags.string({
    description: 'file parser to use',
    default: 'auto',
    options: ['auto', 'i18next'],
  }),
  'key-generator': flags.string({
    description: 'use hashed or source based keys',
    default: 'source',
    options: ['source', 'hash'],
  }),
};

module.exports = PushCommand;
