"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const config_1 = __importDefault(require("./db/redis/config"));
const controller_1 = require("./controller");
const onConnection = (server) => {
    console.log('SOCKET CONNECTED');
    exports.socket = server;
    /************************************************************************
                                    홈
     ************************************************************************/
    server.on('none', controller_1.home.noneController);
    server.on('front', controller_1.home.frontController);
    server.on('sign', controller_1.home.signController);
    /************************************************************************
                                    필드
     ************************************************************************/
    server.on('dungeon', controller_1.field.dungeonController);
    server.on('village', controller_1.field.villageController);
    /************************************************************************
                                    전투
     ************************************************************************/
    server.on('battle', controller_1.battle.battleController);
    server.on('encounter', controller_1.battle.encounterController);
    server.on('action', controller_1.battle.actionController);
    server.on('fight', controller_1.battle.fightController);
    /************************************************************************
                                   모험 종료
     ************************************************************************/
    server.on('adventureResult', controller_1.battle.resultController);
    /************************************************************************
                                    채팅박스
     ************************************************************************/
    server.on('submit', controller_1.chat.chatController);
    server.on('disconnect', () => {
        config_1.default.del(server.id);
        console.log(server.id, 'SOCKET DISCONNECTED');
    });
};
exports.default = onConnection;
