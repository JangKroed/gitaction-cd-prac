"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_routes_1 = require("../socket.routes");
const handler_1 = require("../handler");
exports.default = {
    battleController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().split(' ');
        console.log('socketon battle');
        const commandRouter = {
            도움말: handler_1.battle.help,
            수동: handler_1.battle.encounter,
            자동: handler_1.battle.auto,
            돌: handler_1.dungeon.getDungeonList,
        };
        if (!commandRouter[CMD1]) {
            console.log(`is wrong command : '${CMD1}'`);
            const result = handler_1.battle.wrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        const result = yield commandRouter[CMD1](CMD2, user);
        socket_routes_1.socket.emit('print', result);
    }),
    encounterController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().split(' ');
        console.log('socketon enccounter');
        const commandRouter = {
            load: handler_1.battle.encounter,
            도움말: handler_1.battle.ehelp,
            공격: handler_1.battle.attack,
            도망: handler_1.battle.run,
        };
        if (!commandRouter[CMD1]) {
            console.log(`is wrong command : '${CMD1}'`);
            const result = handler_1.battle.wrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        let result = yield commandRouter[CMD1](CMD2, user);
        const target = result.field === 'action' ? 'printBattle' : 'print';
        socket_routes_1.socket.emit(target, result);
    }),
    actionController: ({ line, user, option }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().split(' ');
        /**
         * action:time
         * 타임스탬프를 함께 전달하고 이를 바탕으로 스킬 재사용 가능여부 판별
         */
        const result = yield handler_1.battle.actionSkill(CMD1, user);
        if (Object.hasOwn(result, 'error')) {
            return socket_routes_1.socket.emit('print', result);
        }
        if (!result.dead) {
            result.cooldown = Date.now();
            return socket_routes_1.socket.emit('printBattle', result);
        }
        const deadResult = yield handler_1.battle.reEncounter('', result.user);
        deadResult.script = result.script + deadResult.script;
        socket_routes_1.socket.emit('print', deadResult);
    }),
    fightController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().split(' ');
        console.log('socketon fight');
        const commandRouter = {
            stop: handler_1.battle.fhelp,
            스킬: handler_1.battle.skill,
        };
        if (!commandRouter[CMD1]) {
            console.log(`is wrong command : '${CMD1}'`);
            const result = handler_1.battle.fwrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        const result = yield commandRouter[CMD1](CMD2, user);
        socket_routes_1.socket.emit('print', result);
    }),
    resultController: ({ line, user }) => __awaiter(void 0, void 0, void 0, function* () {
        const [CMD1, CMD2] = line.trim().split(' ');
        const commandRouter = {
            load: handler_1.battle.adventureload,
            확인: handler_1.battle.getDetail,
            마을: handler_1.battle.returnVillage,
        };
        if (!commandRouter[CMD1]) {
            console.log(`is wrong command : '${CMD1}'`);
            const result = handler_1.battle.adventureWrongCommand(CMD1, user);
            return socket_routes_1.socket.emit('print', result);
        }
        const result = yield commandRouter[CMD1](CMD2, user);
        socket_routes_1.socket.emit('print', result);
    })
};
// const newScript: CommandRouter = {
//     monster: battle.encounter,
//     player: dungeon.getDungeonList,
// };
// // let result;
// if (CMD1 === '공격') {
//     const basicFight = setInterval(async () => {
//         result = await battle.manualLogic(CMD2, user);
//         socket.emit('printBattle', result);
//         if (result.dead.match(/player|monster/)) {
//             clearInterval(battleLoops[user.characterId]);
//             result = await newScript[result.dead](CMD2, user)
//             socket.emit('print', result);
//         }
//     }, 1500);
//     battleLoops[user.characterId] = basicFight;
// } else if (CMD1 === '스킬') {
//     result = await battle.skill(CMD2, user);
//     if (result.dead.match(/player|monster/)) {
//         socket.emit('print', result);
//         clearInterval(battleLoops[user.characterId]);
//         result = await newScript[result.dead](CMD2, user);
//     }
// } else if (!commandRouter[CMD1]) {
//     console.log(`is wrong command : '${CMD1}'`);
//     result = battle.ewrongCommand(CMD1, user);
// } else {
//     result = await commandRouter[CMD1](CMD2, user);
// }
