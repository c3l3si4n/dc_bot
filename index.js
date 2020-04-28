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
  bot.navigate.on('pathFound', function(path) {
    console.log('[navigation] found path. I can get there in ' + path.length + ' moves.');
  });
  bot.navigate.on('cannotFind', function(closestPath) {
    console.log('[navigation] unable to find path. getting as close as possible');
    bot.navigate.walk(closestPath);
  });

  bot.navigate.on('interrupted', function() {
    console.log('[navigation] stopping');
  });
  bot.on('end', function() {
    console.log('[!] Disconnecting');
    process.exit();
  });
  bot.on('chat', async function(username, message, translate, jsonMsg, matches) {
    console.log('[chat]', username, ': ', message);
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
      if (message[0] == '*') {
        const cmd = message.split('*')[1];
        console.log('Eval: ' + cmd);
        let output = eval(cmd);
        if (typeof output != 'string') output = String(output);
        console.log(output);
        bot.chat(output);
      }
    }
  });

  let controlLogin = true;
  bot.on('message', async function(msg) {
    console.log('[msg] ', msg.text);
    if (msg.text.includes('faça o login digitando') || msg.text.includes('favor registre-se') && controlLogin) {
      controlLogin = false;
      await bot.chat('/register wiggahigga wiggahigga');
      await bot.chat('/login wiggahigga');
      console.log('Username: ' + bot.username);
      await delay(1000);
      await bot.setQuickBarSlot(3);
      await delay(1000);
      await bot.activateItem();
      await delay(1000);
      if (bot.currentWindow.title == '{"text":"Servidores"}' && !entered) {
        entered = true;
        await delay(500);
        const fullPvpSlot = 9;
        await bot.clickWindow(fullPvpSlot, 0, 0, async () => {
          await bot.closeWindow(bot.currentWindow);
        });
        console.log('FullPVP 1 entered!');
      }
    }
    if (msg.text.includes('Conta autenticada!')) {
      await bot.setQuickBarSlot(3);
    }
  });

  const tossStack_promise = util.promisify(bot.tossStack);

  async function repeatingDig(block) {
    return new Promise(async (resolve, reject) => {
      while (bot.blockAt(block.position).material != undefined) {
        await dig_promise(block);
      }
      resolve();
    });
  }

  const branchPlace = eval(args[2]);

  async function drop_item(slot) {
    return new Promise((resolve) => {
      bot.moveSlotItem(slot, -999, async () => {
        callback();
      });
    });
  }

  async function drop_items() {
    for await (const item of bot.inventory.slots) {
      try {
        if (item) {
          if (item.slot != 36) {
            console.log('Chegou aqui...');
            console.log(item);
            await drop_item(item.slot);
          }
        }
      } catch (e) {
        console.log('Error happened on tossing: ', e);
        process.exit(0);
      }
    };
  }

  async function sell_wood() {
    const signWood1 = vec3(16931, 39, 16919);
    const signWood2 = vec3(16932, 39, 16919);
    const signWood3 = vec3(16933, 39, 16919);
    const signWood4 = vec3(16936, 39, 16919);
    const signWood5 = vec3(16937, 39, 16919);
    const signWood6 = vec3(16938, 39, 16919);
    const sellSpot = vec3(16937, 38, 16920);

    await bot.chat('/home madeira');
    await delay(6000);
    await dig_promise(bot.blockAt(signWood1));
    await dig_promise(bot.blockAt(signWood2));
    await dig_promise(bot.blockAt(signWood3));
    const path = await bot.navigate.findPathSync(sellSpot);

    bot.navigate.walk(path.path, async (stopReason) => {
      await dig_promise(bot.blockAt(signWood4));
      await dig_promise(bot.blockAt(signWood5));
      await dig_promise(bot.blockAt(signWood6));
      await bot.chat('/pay ropch4in 500000');
	  const path = await bot.navigate.findPathSync(vec3(16937,37,16926));
	  bot.navigate.walk(path.path, async(stopReason) => {
      return await branch_mining(); });
    });
  }

  function degrees_to_radians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }

  async function dig_hole(position) {
    return new Promise(async (resolve, reject) => {
      const pathToHole = await bot.navigate.findPathSync(position);
      console.log('[*] Going to position: ', position);
      if (pathToHole.status == 'success') {
        bot.navigate.walk(pathToHole.path, async (stopReason) => {
          await bot.look(0, piMinus / 2, true);
          const block = bot.blockInSight();
          await repeatingDig(block);
          resolve(bot.entity.position);
        });
      } else {
        position.y -= 1;
        const pathToHole = await bot.navigate.findPathSync(position);
        console.log('[*] Going to position: ', position);
        if (pathToHole.status == 'success') {
          bot.navigate.walk(pathToHole.path, async (stopReason) => {
            await bot.look(0, piMinus / 2, true);
            const block = bot.blockInSight();
            await repeatingDig(block);
            resolve(bot.entity.position);
          });
        } else {
          console.log('[!]Path to hole FAILED!');
          failureCount = failureCount + 1;
          if (failureCount >= 10) {
            console.log('[!] Leaving due to failure count being exceeded.');
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
    if (coord.z == 16984) return false;
    return true;
  }
  function healthCheck() {
    bot.chat('/fix all');
    const pos = bot.entity.position;
    const stuckBlock = bot.blockAt(pos);
    const isAtSurface = pos.z > 16926 && pos.y >= 36;
    if (stuckBlock.material != undefined || isAtSurface) {
      console.log('Bot seems stuck.. restarting..');
      process.exit();
    }
  }

  setInterval(healthCheck, 30000);

  async function dig_line(yaw, callback) {
    return new Promise(async (resolve) => {
      const limit = 16984;


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
      const path = await bot.navigate.findPathSync(belowPosition);
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

    if (pos != limit) {
      await walk_relative(0, 0, - 1);
      mine_and_move(bot.entity.position.z, limit);
    } else {
      console.log('I am done. Selling my inventory..');
      return sell_dirt();
    }
  }

  async function branch_mining(start_position = vec3(16940, 37, 16927)) {
    start_position.x =
      branchPlace[Math.floor(Math.random() * branchPlace.length)];
    console.log('Arguments', args);
    dig_hole(start_position).then(async (newPos) => {
      const digHoleTemplate = 'newPos.y -= 1;await dig_hole(newPos);';
      const digHoleCommand = '(async ()=>{' + digHoleTemplate.repeat(Number(args[1])) + '})()';
      await eval(digHoleCommand);
      await delay(1000);
      await dig_line(180);
    }).catch(async (e) => {
      console.log('[!] Failing on branch_mining()\nDetails: ', e);
      process.exit();
    });
  }

  delay(10000).then(() => {
    sell_wood();
  });
}

initBot();
