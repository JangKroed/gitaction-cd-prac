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
const services_1 = require("../../services");
const handler_1 = require("../../handler");
const scripts_1 = require("../../scripts");
exports.default = {
    loadHome: (CMD, user) => {
        console.log('LOAD HOME');
        const script = scripts_1.homeScript.loadHome;
        const field = 'front';
        return { script, user, field };
    },
    checkUser: (user) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('CHECK USER');
        const { userId, characterId, name } = user;
        const character = yield services_1.CharacterService.findOneByUserId(userId);
        // userSession으로 들어온 정보와 일치하는 캐릭터가 없을 때
        return (!character || character.characterId !== characterId || character.name !== name);
    }),
    signout: (CMD, user, id) => {
        console.log('SIGN OUT');
        services_1.UserService.signout(user.userId, id);
        const script = scripts_1.homeScript.signout;
        const field = 'signout';
        return { script, user, field };
    },
    toVillage: (CMD, user) => {
        console.log('TO VILLAGE');
        const script = scripts_1.homeScript.loadHome; // 마을 스크립트
        const field = 'front';
        return { script, user, field, chat: true };
    },
    toDungeon: (CMD, user) => {
        console.log('TO DUNGEON');
        const script = (0, handler_1.dungeonList)(user.name);
        const field = 'dungeon';
        return { script, user, field, chat: true };
    },
    emptyCommand: (CMD, user) => {
        console.log('EMPTY COMMAND');
        const script = scripts_1.homeScript.wrongCommand;
        const field = 'front';
        return { script, user, field };
    },
};
