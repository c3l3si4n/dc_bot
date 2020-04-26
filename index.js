const mineflayer = require('mineflayer');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const PNGImage = require('pngjs-image');
const Jimp = require('jimp'); //For image processing
const delay = require('delay');
const fs = require('fs');
const utils = require('./util');
const readline = require("readline");
const util = require('util');
const Item = require("prismarine-item")("1.8.9");
const mcdata = require('minecraft-data')("1.8.9");
bots_count = ['botnildo1', 'botnildo2', 'botnildo3', 'botnildo4', 'botnildo5'];
let entered = false;
const diamond_sword = new Item(276, 0);
let pi = Math.PI;
let piMinus = Math.PI * -1;
var white = Jimp.rgbaToInt(255, 255, 255, 255);
var black = Jimp.rgbaToInt(0, 0, 0, 255);
var gray = Jimp.rgbaToInt(200, 200, 200, 255);
let vec3 = require('vec3');
let shouldDigHole = false;
let bot = mineflayer.createBot({
    host: 'mc.playdreamcraft.com.br',
    port: 25565,
    version: '1.8.9',
    username: 'LexorPvP_'
});
let dig_promise = util.promisify(bot.dig);
navigatePlugin(bot);
bot.navigate.on('pathFound', function(path) {
    console.log("[navigation] found path. I can get there in " + path.length + " moves.");
});
bot.navigate.on('cannotFind', function(closestPath) {
    console.log("[navigation] unable to find path. getting as close as possible");
    bot.navigate.walk(closestPath);
});
bot.navigate.on('arrived', async function() {

});
bot.navigate.on('interrupted', function() {
    console.log("[navigation] stopping");
});
bot.on("chat", async function(username, message, translate, jsonMsg, matches) {

    if (username == 'ropch4in') {
        if (message.includes("vem ca")) {
            const target = bot.players[username].entity;
            bot.navigate.to(target.position);
        }
        if (message[0] == "!") {
            console.log("Got chat command");
            let cmd = message.split('!')[1];
            console.log("Running: " + cmd);
            await bot.chat(cmd)
        }
        if (message[0] == "$") {
            let cmd = message.split('$')[1];
            console.log('Eval: ' + cmd);
            let output = eval(cmd);
            if (typeof output != 'string') output = String(output);
            console.log(output);
            bot.chat(output)
        }
    }


});
bot.on('message', async function(msg) {
    console.log(msg.text);
    if (msg.text.includes('faça o login digitando') || msg.text.includes('favor registre-se')) {
        bot.setControlState('sprint', true);
        await bot.chat("/register wiggahigga wiggahigga");
        await bot.chat("/login wiggahigga");
        console.log("Username: " + bot.username);
        await delay(150);
        await bot.setQuickBarSlot(3);
        await delay(150);
        await bot.activateItem();
        await delay(150);
        if (bot.currentWindow.title == '{"text":"Servidores"}' && !entered) {
            entered = true;
            await delay(150);
            let fullPvpSlot = 9;
            await bot.clickWindow(fullPvpSlot, 0, 0);
            await bot.closeWindow(bot.currentWindow);
            console.log("FullPVP 1 entered!")

        }
    }
    if (msg.text.includes('Conta autenticada!')) {
        await bot.setQuickBarSlot(3)

    }
});


bot._client.on('map', ({ data }) => {

    if (!data) return;

    let size = Math.sqrt(data.length);
    if (size != 128) return;
    let image = PNGImage.createImage(size, size);

    console.log(`Map size is ${size}x${size}`);

    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {

            let colorId = data[x + (z * size)];
            image.setAt(x, z, utils.getColor(colorId));

        }
    }
    image.writeImage('map.png', () => {
        Jimp.read('map.png', (err, captcha) => {
            if (err) throw err;
            fillGaps(captcha, 1, (captcha_filled) => {
                thinOut(captcha_filled, 1, (cleaned_captcha) => {
                    cleaned_captcha.grayscale().write('cleaned.png')

                })
            })
        });
    });

    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("What is the Captcha answer? (cleaned.png) ", function(code) {
        bot.chat(code);
        rl.close();
        console.log("Sent " + code + " answer.")
    });
    bot._client.on('map', function() {})


});

function mineLine(start, yaw) { // start,end = [x,y,z]

}


function fillGaps(image, iterations, callback) {
    iterations--;
    new Jimp(image.bitmap.width, image.bitmap.height, white, (err, newImage) => {
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            var color = image.getPixelColor(x, y);
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
        })
    });
}

function thinOut(image, iterations, callback) {
    iterations--;
    new Jimp(image.bitmap.width, image.bitmap.height, white, (err, newImage) => {
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            var color = image.getPixelColor(x, y);
            if (color != white) {
                var l = image.getPixelColor(x - 1, y);
                var r = image.getPixelColor(x + 1, y);
                var t = image.getPixelColor(x, y + 1);
                var b = image.getPixelColor(x, y - 1);

                var lb = image.getPixelColor(x - 1, y - 1);
                var lt = image.getPixelColor(x - 1, y + 1);
                var rt = image.getPixelColor(x + 1, y + 1);
                var rb = image.getPixelColor(x + 1, y - 1);
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
        })
    });
}
let branchPlace = [14940, 14950, 14960, 14970]
let branchIndex = 3
async function sell_dirt() {
    let sellSpot = vec3(14978, 38, 14990);
    let signDirt = vec3(14978, 39, 14992);
    let signCoarsedDirt = vec3(14977, 39, 14992);
    await bot.chat("/warp terra");
    await delay(5200);
    let path = await bot.navigate.findPathSync(sellSpot);

    bot.navigate.walk(path.path, async(stopReason) => {
        bot.dig(bot.blockAt(signDirt), async() => {
            bot.dig(bot.blockAt(signCoarsedDirt), async() => {
                let branchStartSpot = vec3(14972, 37, 14984)
                let path = await bot.navigate.findPathSync(branchStartSpot);

                bot.navigate.walk(path.path, async(stopReason) => {
                    branch_mining()
                });
            });

        })
    })
}

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

async function dig_hole(position) {
    return new Promise(async(resolve, reject) => {
        pathToHole = await bot.navigate.findPathSync(position);
        if (pathToHole.status == 'success') {
            bot.navigate.walk(pathToHole.path, async(stopReason) => {
                await bot.look(0, piMinus / 2, true);
                block = bot.blockInSight();
                await dig_promise(block);
                resolve()
            })
        } else {
            console.log("[!]Path to hole FAILED!")
            reject()
        }
    })


}

let directionMap = {
    '180': 'vec3(bot.entity.position.x, bot.entity.position.y + 1, bot.entity.position.z +1)',
    '0': 'vec3(bot.entity.position.x, bot.entity.position.y + 1, bot.entity.position.z - 1)',
    '90': 'vec3(bot.entity.position.x - 1, bot.entity.position.y + 1, bot.entity.position.z )',
    '270': 'vec3(bot.entity.position.x + 1, bot.entity.position.y + 1, bot.entity.position.z)',
};
let singleDirectionMap = {
    '180': 'blockPosition.z += 1',
    '0': 'blockPosition.z -= 1',
    '90': 'blockPosition.x -= 1',
    '270': 'blockPosition.x += 1',
};

function check_limit(coord) {
    levelOne = vec3(coord.x, coord.y + 2, coord.z);
    levelTwo = vec3(coord.x, coord.y + 1, coord.z);
    levelThree = vec3(coord.x, coord.y, coord.z);
    levelFour = vec3(coord.x, coord.y - 1, coord.z);
    levelFive = vec3(coord.x, coord.y - 2, coord.z);
    blockOne = bot.blockAt(levelOne);
    blockTwo = bot.blockAt(levelTwo);
    blockThree = bot.blockAt(levelThree);
    blockFour = bot.blockAt(levelFour);
    blockFive = bot.blockAt(levelFive);
    if (blockOne.material === 'wood' || blockTwo.material === 'wood' || blockThree.material === 'wood' || blockFour.material === 'wood' || blockFive.material == 'wood') {
        return false
    }
    if (coord.z == 14926) return false;
    return true;


}

function healthCheck() {
    bot.chat("/fix all")
    let pos = bot.entity.position
    let stuckBlock = bot.blockAt(pos)
    if (stuckBlock.material != undefined) {
        console.log("Bot seems stuck.. restarting..")
        sell_dirt()
    }
}

setInterval(healthCheck, 30000);

async function dig_line(yaw, callback) {

    return new Promise(async(resolve) => {
        let limit = 14983;

        bot.setControlState('sprint', true);

        let yaw_radian = degrees_to_radians(yaw);


        let blockPosition = eval(directionMap[yaw.toString()]);
        let block = await bot.blockAt(blockPosition);
        let belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        let belowBlock = await bot.blockAt(belowPosition);
        console.log(block.position)
        console.log(belowBlock.position)
        let canDigBlock = bot.canDigBlock(block);
        let canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position)) {
            await dig_promise(block);
        }
        await (delay(250))
        if (canDigBelowBlock && check_limit(belowBlock.position)) {
            await dig_promise(belowBlock);
        }
        await (delay(250))


        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block) && check_limit(block.position) && block.type != 0;
        canDigBelowBlock = bot.canDigBlock(belowBlock) && check_limit(belowBlock.position) && block.material != 0;
        if (canDigBlock && check_limit(block.position)) {
            await dig_promise(block);
        }
        await (delay(250))
        if (canDigBelowBlock && check_limit(belowBlock.position)) {
            await dig_promise(belowBlock);
        }
        await (delay(250))


        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position)) {
            await dig_promise(block);
        }
        await (delay(250))
        if (canDigBelowBlock && check_limit(belowBlock.position)) {
            await dig_promise(belowBlock);
        }
        await (delay(250))

        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position)) {
            await dig_promise(block);
        }
        await (delay(250))
        if (canDigBelowBlock && check_limit(belowBlock.position)) {
            await dig_promise(belowBlock);
        }
        await (delay(250))



        console.log("[*] Broke 4 lower and upper block.")
        console.log('[*] Looking for position: ', belowPosition)
        path = await bot.navigate.findPathSync(belowPosition);
        console.log("[*] Got path to last broken block.\nStatus:", path.status)

        if (path.status == 'success') {
            console.log("[*] Path generated successfully.")
            bot.navigate.walk(path.path, async(stopReason) => {
                console.log("[*] Arrived to last broken block.")
                blockPosition = eval(directionMap[yaw.toString()]);
                belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
                block = bot.blockAt(blockPosition);
                belowBlock = bot.blockAt(belowPosition);

                if (check_limit(block.position)) {
                    console.log("[*] Starting again.")
                    dig_line(yaw);
                } else {
                    console.log("[*] Returning.")
                    mine_and_move(bot.entity.position.z, limit);
                    resolve()
                }


            })
        } else {
            resolve()
        }


    });

}

async function dig_line_without_walk(yaw, callback) {
    return new Promise(async(resolve) => {
        let yaw_radian = degrees_to_radians(yaw);


        let blockPosition = eval(directionMap[yaw.toString()]);
        let block = await bot.blockAt(blockPosition);
        let belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        let belowBlock = await bot.blockAt(belowPosition);

        let canDigBlock = bot.canDigBlock(block);
        let canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position) && block.type != 0) {
            console.log("Digging Block: ", block.name);
            await dig_promise(block);
        }
        if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
            console.log("Digging Block: ", belowBlock.name);
            await dig_promise(belowBlock);
        }


        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position) && block.type != 0) {
            await dig_promise(block);
        }
        if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
            await dig_promise(belowBlock);
        }
        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position) && block.type != 0) {
            await dig_promise(block);
        }
        if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
            await dig_promise(belowBlock);
        }
        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position) && block.type != 0) {
            await dig_promise(block);
        }
        if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
            await dig_promise(belowBlock);
        }
        eval(singleDirectionMap[yaw]);
        block = await bot.blockAt(blockPosition);

        belowPosition = vec3(block.position.x, block.position.y - 1, block.position.z);
        belowBlock = await bot.blockAt(belowPosition);

        canDigBlock = bot.canDigBlock(block);
        canDigBelowBlock = bot.canDigBlock(belowBlock);

        if (canDigBlock && check_limit(block.position) && block.type != 0) {
            await dig_promise(block);
        }
        if (canDigBelowBlock && check_limit(belowBlock.position) && block.type != 0) {
            await dig_promise(belowBlock);
        }


        resolve(1)
    })


}

async function walk_relative(x, y, z) {
    return new Promise(async resolve => {
        let oldPos = bot.entity.position;
        let newPos = vec3(oldPos.x + x, oldPos.y + y, oldPos.z + z);
        let path = await bot.navigate.findPathSync(newPos);
        if (path.status != 'success') return false;
        bot.navigate.walk(path.path, async(stopReason) => {
            resolve();
        })

    })

}

async function mine_and_move(current, limit) {
    await dig_line_without_walk(90);
    await dig_line_without_walk(270);

    await walk_relative(0, 0, 1);

    if (current != limit) {
        console.log('going left.')
        mine_and_move(bot.entity.position.z, limit)
    } else {
        console.log('I am done. Selling my inventory..')
        return sell_dirt()
    }
}

async function branch_mining(start_position = vec3(14960, 37, 14983)) {
    branchIndex -= 1;
    if (branchIndex < 0) {
        branchIndex = 4;
    }
    start_position.x = branchPlace[branchIndex]
    console.log('Branch Mining...');

    console.log("Digging Hole..");
    await dig_hole(start_position).catch(() => {
        return branch_mining();
    });
    await dig_hole(bot.entity.position);
    await dig_hole(bot.entity.position);
    await dig_hole(bot.entity.position);
    await dig_hole(bot.entity.position);
    await dig_hole(bot.entity.position);

    let current_position = bot.entity.position;
    console.log("Starting Mining...");
    await delay(1000);
    await dig_line(0);
    console.log("Digged Line...");




    console.log("Finished.")

}

delay(5000).then(() => {
    sell_dirt()
});