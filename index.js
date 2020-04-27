/* eslint-disable require-jsdoc */
/* eslint-disable linebreak-style */
'use strict';
const mineflayer = require('mineflayer');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const PNGImage = require('pngjs-image');
const Jimp = require('jimp'); // For image processing
const delay = require('delay');
const utils = require('./util');
const readline = require('readline');
const util = require('util');
const args = process.argv.splice(process.execArgv.length + 2);
let entered = false;
const piMinus = Math.PI * -1;
const white = Jimp.rgbaToInt(255, 255, 255, 255);

const vec3 = require('vec3');
let failureCount = 0;

function initBot() {
  const bot = mineflayer.createBot({
    host: 'girafa.playdreamcraft.com.br',
    port: 25565,
    version: '1.8.9',
    username: args[0],
  });
  const dig_promise = util.promisify(bot.dig);
  navigatePlugin(bot);
  bot.navigate.on('pathFound', function (path) {
    console.log('[navigation] found path. I can get there in ' + path.length + ' moves.');
  });
  bot.navigate.on('cannotFind', function (closestPath) {
    console.log('[navigation] unable to find path. getting as close as possible');
    bot.navigate.walk(closestPath);
  });

  bot.navigate.on('interrupted', function () {
    console.log('[navigation] stopping');
  });
  bot.on('end', function () {
    console.log('[!] Disconnecting');
    process.exit();
  });
  bot.on('chat', async function (username, message, translate, jsonMsg, matches) {
    if (username == 'ropch4in') {
      if (message.includes('vem ca')) {
        const target = bot.players[username].entity;
        bot.navigate.to(target.position);
      }
      if (message[0] == '!') {
        console.log('Got chat command');
        const cmd = message.split('!')[1];
        console.log('Running: ' + cmd);
        await bot.chat(cmd);
      }
      if (message[0] == '$') {
        const cmd = message.split('$')[1];
        console.log('Eval: ' + cmd);
        let output = eval(cmd);
        if (typeof output != 'string') output = String(output);
        console.log(output);
        bot.chat(output);
      }
    }
  });
  bot.on('message', async function (msg) {
    if (msg.text.includes('faça o login digitando') || msg.text.includes('favor registre-se')) {
      await bot.chat('/register wiggahigga wiggahigga');
      await bot.chat('/login wiggahigga');
      console.log('Username: ' + bot.username);
      await delay(500);
      await bot.setQuickBarSlot(3);
      await delay(500);
      await bot.activateItem();
      await delay(500);
      if (bot.currentWindow.title == '{"text":"Servidores"}' && !entered) {
        entered = true;
        await delay(500);
        const fullPvpSlot = 9;
        await bot.clickWindow(fullPvpSlot, 0, 0);
        await bot.closeWindow(bot.currentWindow);
        console.log('FullPVP 1 entered!');
      }
    }
    if (msg.text.includes('Conta autenticada!')) {
      await bot.setQuickBarSlot(3);
    }
  });


  bot._client.on('map', ({ data }) => {
    if (!data) return;

    const size = Math.sqrt(data.length);
    if (size != 128) return;
    const image = PNGImage.createImage(size, size);

    console.log(`Map size is ${size}x${size}`);

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const colorId = data[x + (z * size)];
        image.setAt(x, z, utils.getColor(colorId));
      }
    }
    image.writeImage('map.png', () => {
      Jimp.read('map.png', (err, captcha) => {
        if (err) throw err;
        fillGaps(captcha, 1, (captcha_filled) => {
          thinOut(captcha_filled, 1, (cleaned_captcha) => {
            cleaned_captcha.grayscale().write('cleaned.png');
          });
        });
      });
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('What is the Captcha answer? (cleaned.png) ', function (code) {
      bot.chat(code);
      rl.close();
      console.log('Sent ' + code + ' answer.');
    });
    bot._client.on('map', function () { });
  });

  async function repeatingDig(block) {
    return new Promise(async (resolve, reject) => {
      while (bot.blockAt(block.position).material != undefined) {
        await dig_promise(block);
      }
      resolve();
    });
  }

  function fillGaps(image, iterations, callback) {
    iterations--;
    new Jimp(image.bitmap.width, image.bitmap.height, white, (err, newImage) => {
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const color = image.getPixelColor(x, y);
        if (color != white) {
          newImage.setPixelColor(color, x - 1, y - 1);
          newImage.setPixelColor(color, x, y - 1);
          newImage.setPixelColor(color, x, y - 1);

          newImage.setPixelColor(color, x - 1, y + 1);
          newImage.setPixelColor(color, x, y + 1);
          newImage.setPixelColor(color, x + 1, y + 1);

          newImage.setPixelColor(color, x, y);
          newImage.setPixelColor(color, x - 1, y);
          newImage.setPixelColor(color, x + 1, y);
        }
        if (x == image.bitmap.width - 1 && y == image.bitmap.height - 1) {
          if (iterations <= 0) {
            callback(newImage);
          } else {
            fillGaps(newImage, iterations, callback);
          }
        }
      });
    });
  }

  function thinOut(image, iterations, callback) {
    iterations--;
    new Jimp(image.bitmap.width, image.bitmap.height, white, (err, newImage) => {
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const color = image.getPixelColor(x, y);
        if (color != white) {
          const l = image.getPixelColor(x - 1, y);
          const r = image.getPixelColor(x + 1, y);
          const t = image.getPixelColor(x, y + 1);
          const b = image.getPixelColor(x, y - 1);

          const lb = image.getPixelColor(x - 1, y - 1);
          const lt = image.getPixelColor(x - 1, y + 1);
          const rt = image.getPixelColor(x + 1, y + 1);
          const rb = image.getPixelColor(x + 1, y - 1);
          if (l == white || r == white || t == white || b == white || lb == white || lt == white || rt == white || rb == white) {
            newImage.setPixelColor(white, x, y);
          } else {
            newImage.setPixelColor(color, x, y);
          }
        }

        if (x == image.bitmap.width - 1 && y == image.bitmap.height - 1) {
          if (iterations <= 0) {
            callback(newImage);
          } else {
            thinOut(newImage, iterations, callback);
          }
        }
      });
    });
  }
  // let branchPlace = [14940, 14950, 14960, 14970]
  const branchPlace = eval(args[2]);

  let branchIndex = 3;
  async function sell_dirt() {
    const sellSpot = vec3(14978, 38, 14990);
    const signDirt = vec3(14978, 39, 14992);
    const signCoarsedDirt = vec3(14977, 39, 14992);
    const initialSpot = vec3(14996, 46, 14993);
    await bot.chat('/warp terra');
    await delay(6000);
    const path = await bot.navigate.findPathSync(initialSpot);
    bot.navigate.walk(path.path, async (stopReason) => {
      const path = await bot.navigate.findPathSync(sellSpot);

      bot.navigate.walk(path.path, async (stopReason) => {
        bot.dig(bot.blockAt(signDirt), async () => {
          bot.dig(bot.blockAt(signCoarsedDirt), async () => {
            await bot.chat('/pay ropch4in 500000');
            const branchStartSpot = vec3(14972, 37, 14984);
            const path = await bot.navigate.findPathSync(branchStartSpot);

            bot.navigate.walk(path.path, async (stopReason) => {
              return branch_mining();
            });
          });
        });
      });
    });
  }

  function degrees_to_radians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }

  async function dig_hole(position) {
    return new Promise(async (resolve, reject) => {
      let pathToHole = await bot.navigate.findPathSync(position);
      console.log('[*] Going to position: ', position);
      if (pathToHole.status == 'success') {
        bot.navigate.walk(pathToHole.path, async (stopReason) => {
          await bot.look(0, piMinus / 2, true);
          let block = bot.blockInSight();
          await repeatingDig(block);
          resolve(bot.entity.position);
        });
      } else {
        position.y -= 1;
        let pathToHole = await bot.navigate.findPathSync(position);
        console.log('[*] Going to position: ', position);
        if (pathToHole.status == 'success') {
          bot.navigate.walk(pathToHole.path, async (stopReason) => {
            await bot.look(0, piMinus / 2, true);
            let block = bot.blockInSight();
            await repeatingDig(block);
            resolve(bot.entity.position);
          });
        } else {
          console.log('[!]Path to hole FAILED!');
          failureCount = failureCount + 1;
          if (failureCount >= 10) {
            console.log("[!] Leaving due to failure count being exceeded.")
            process.exit();
          }
          reject();
        }
      }
    });
  }

  const directionMap = {
    '180': 'vec3(bot.entity.position.x, bot.entity.position.y + 1, bot.entity.position.z +1)',
    '0': 'vec3(bot.entity.position.x, bot.entity.position.y + 1, bot.entity.position.z - 1)',
    '90': 'vec3(bot.entity.position.x - 1, bot.entity.position.y + 1, bot.entity.position.z )',
    '270': 'vec3(bot.entity.position.x + 1, bot.entity.position.y + 1, bot.entity.position.z)',
  };
  const singleDirectionMap = {
    '180': 'blockPosition.z += 1',
    '0': 'blockPosition.z -= 1',
    '90': 'blockPosition.x -= 1',
    '270': 'blockPosition.x += 1',
  };

  function check_limit(coord) {
    let levelOne = vec3(coord.x, coord.y + 2, coord.z);
    let levelTwo = vec3(coord.x, coord.y + 1, coord.z);
    let levelThree = vec3(coord.x, coord.y, coord.z);
    let levelFour = vec3(coord.x, coord.y - 1, coord.z);
    let levelFive = vec3(coord.x, coord.y - 2, coord.z);
    let blockOne = bot.blockAt(levelOne);
    let blockTwo = bot.blockAt(levelTwo);
    let blockThree = bot.blockAt(levelThree);
    let blockFour = bot.blockAt(levelFour);
    let blockFive = bot.blockAt(levelFive);
    if (blockOne.material === 'wood' || blockTwo.material === 'wood' || blockThree.material === 'wood' || blockFour.material === 'wood' || blockFive.material == 'wood') {
      return false;
    }
    if (coord.z == 14926) return false;
    return true;
  }
  let lastPosition;
  let healthBypass = false;
  function healthCheck() {
    bot.chat('/fix all');
    const pos = bot.entity.position;
    const stuckBlock = bot.blockAt(pos);
    const isAtSurface = pos.z < 14984 && pos.y >= 36;
    if (stuckBlock.material != undefined || isAtSurface) {
      console.log('Bot seems stuck.. restarting..');
      sell_dirt();
    }
    lastPosition = bot.entity.position;
  }

  setInterval(healthCheck, 30000);

  async function dig_line(yaw, callback) {
    return new Promise(async (resolve) => {
      const limit = 14983;


      const yaw_radian = degrees_to_radians(yaw);


      let blockPosition = eval(directionMap[yaw.toString()]);
      let block = await bot.blockAt(blockPosition);
      let belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      let belowBlock = await bot.blockAt(belowPosition);

      let canDigBlock = bot.canDigBlock(block);
      let canDigBelowBlock = bot.canDigBlock(belowBlock);
      if (canDigBlock && block && check_limit(block.position)) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position)) {
        await repeatingDig(belowBlock);
      }


      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block) && check_limit(block.position) && block.type != 0;
      canDigBelowBlock = bot.canDigBlock(belowBlock) && check_limit(belowBlock.position) && block.material != 0;
      if (canDigBlock && block && check_limit(block.position)) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position)) {
        await repeatingDig(belowBlock);
      }

      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && block && check_limit(block.position)) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position)) {
        await repeatingDig(belowBlock);
      }

      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && block && check_limit(block.position)) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position)) {
        await repeatingDig(belowBlock);
      }


      console.log('[*] Broke 4 lower and upper block.');
      console.log('[*] Looking for position: ', belowPosition);
      let path = await bot.navigate.findPathSync(belowPosition);
      console.log('[*] Got path to last broken block.\nStatus:', path.status);

      if (path.status == 'success') {
        console.log('[*] Path generated successfully.');
        bot.navigate.walk(path.path, async (stopReason) => {
          console.log('[*] Arrived to last broken block.');
          blockPosition = eval(directionMap[yaw.toString()]);
          belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
          block = bot.blockAt(blockPosition);
          belowBlock = bot.blockAt(belowPosition);

          if (check_limit(block.position)) {
            console.log('[*] Starting again.');
            dig_line(yaw);
          } else {
            console.log('[*] Returning.');
            mine_and_move(bot.entity.position.z, limit);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async function dig_line_without_walk(yaw, callback) {
    return new Promise(async (resolve) => {
      const yaw_radian = degrees_to_radians(yaw);


      const blockPosition = eval(directionMap[yaw.toString()]);
      let block = await bot.blockAt(blockPosition);
      let belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      let belowBlock = await bot.blockAt(belowPosition);

      let canDigBlock = bot.canDigBlock(block);
      let canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && check_limit(block.position) && block.type != 0) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
        await repeatingDig(belowBlock);
      }


      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && check_limit(block.position) && block.type != 0) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
        await repeatingDig(belowBlock);
      }
      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && check_limit(block.position) && block.type != 0) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
        await repeatingDig(belowBlock);
      }
      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && check_limit(block.position) && block.type != 0) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
        await repeatingDig(belowBlock);
      }
      eval(singleDirectionMap[yaw]);
      block = await bot.blockAt(blockPosition);

      belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
      belowBlock = await bot.blockAt(belowPosition);

      canDigBlock = bot.canDigBlock(block);
      canDigBelowBlock = bot.canDigBlock(belowBlock);

      if (canDigBlock && check_limit(block.position) && block.type != 0) {
        await repeatingDig(block);
      }
      if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
        await repeatingDig(belowBlock);
      }


      resolve(1);
    });
  }

  async function walk_relative(x, y, z) {
    return new Promise(async (resolve) => {
      const oldPos = bot.entity.position;
      const newPos = vec3(oldPos.x + x, oldPos.y + y, oldPos.z + z);
      const path = await bot.navigate.findPathSync(newPos);
      if (path.status == 'success') {
        bot.navigate.walk(path.path, async (stopReason) => {
          resolve();
        });
      } else {
        newPos.y -= 1;
        const path = await bot.navigate.findPathSync(newPos);
        if (path.status == 'success') {
          bot.navigate.walk(path.path, async (stopReason) => {
            resolve();
          });
        } else {
          newPos.y += 2;
          const path = await bot.navigate.findPathSync(newPos);
          if (path.status == 'success') {
            bot.navigate.walk(path.path, async (stopReason) => {
              resolve();
            });
          } else {
            console.log('[!] Failing on walk_relative()');
            process.exit();
          }
        }
      }


    });
  }

  async function mine_and_move(current, limit) {
    const pos = Math.trunc(current);
    await dig_line_without_walk(90);
    await dig_line_without_walk(270);
    console.log('MINE_AND_MOVE: ', current, limit);

    if (pos != limit) {
      console.log('going left.');
      await walk_relative(0, 0, 1);
      mine_and_move(bot.entity.position.z, limit);
    } else {
      console.log('I am done. Selling my inventory..');
      return sell_dirt();
    }
  }

  async function branch_mining(start_position = vec3(14960, 37, 14983)) {
    start_position.x =
      branchPlace[Math.floor(Math.random() * branchPlace.length)];

    console.log('start_position.x = ', start_position.x);
    console.log('Branch Mining...');

    console.log('Digging Hole..');
    healthBypass = true;
    console.log("Arguments", args);
    dig_hole(start_position).then(async (newPos) => {
      const digHoleTemplate = 'newPos.y -= 1;await dig_hole(newPos);';
      const digHoleCommand = '(async ()=>{' + digHoleTemplate.repeat(Number(args[1])) + '})()';
      console.log("Parsed command: " + digHoleCommand);
      await eval(digHoleCommand);
      console.log('Starting Mining...');
      await delay(1000);
      await dig_line(0);
      console.log('Digged Line...');


      console.log('Finished.');
    }).catch(async (e) => {
      healthBypass = false;
      console.log('[!] Failing on branch_mining()\nDetails: ', e);
      process.exit();
    });
  }


  delay(10000).then(() => {
    sell_dirt();
  });
}

initBot();
