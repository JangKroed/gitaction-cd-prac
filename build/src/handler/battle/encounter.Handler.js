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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.battleLoops = void 0;
const services_1 = require("../../services");
const config_1 = __importDefault(require("../../db/redis/config"));
const battle_Handler_1 = __importDefault(require("./battle.Handler"));
const handler_1 = require("../../handler");
const socket_routes_1 = require("../../socket.routes");
class EncounterHandler {
    constructor() {
        // help: (CMD: string | undefined, user: UserSession) => {}
        this.ehelp = (CMD, user) => {
            let tempScript = '';
            tempScript += '명령어 : \n';
            tempScript += '[공격] 하기 - 전투를 진행합니다.\n';
            tempScript += '[도망] 가기 - 전투를 포기하고 도망갑니다.\n';
            tempScript += '---전투 중 명령어---\n';
            tempScript +=
                '[스킬] [num] 사용 - 1번 슬롯에 장착된 스킬을 사용합니다.\n';
            const script = tempScript;
            const field = 'encounter';
            return { script, user, field };
        };
        this.encounter = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            // 던전 진행상황 불러오기
            let dungeonSession = yield config_1.default.hGetAll(String(user.characterId));
            const dungeonLevel = Number(dungeonSession.dungeonLevel);
            let tempScript = '';
            const tempLine = '=======================================================================\n';
            // 적 생성
            const newMonster = yield services_1.MonsterService.createNewMonster(dungeonLevel, user.characterId);
            tempScript += `너머에 ${newMonster.name}의 그림자가 보인다\n\n`;
            tempScript += `[공격] 하기\n`;
            tempScript += `[도망] 가기\n`;
            // 던전 진행상황 업데이트
            dungeonSession = {
                dungeonLevel: String(dungeonLevel),
                monsterId: String(newMonster.monsterId),
            };
            yield config_1.default.hSet(String(user.characterId), dungeonSession);
            const script = tempLine + tempScript;
            const field = 'encounter';
            return { script, user, field };
        });
        this.attack = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            const newScript = {
                player: handler_1.dungeon.getDungeonList,
                monster: this.reEncounter,
            };
            let result;
            const basicFight = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                result = yield battle_Handler_1.default.manualLogic(CMD, user);
                socket_routes_1.socket.emit('printBattle', result);
                const { dead } = result;
                if (typeof dead === 'string') {
                    // dead ... player / monster
                    result = yield newScript[dead]('', user);
                    socket_routes_1.socket.emit('print', result);
                    console.log('DEAD PRINT WILL CLOSE INTERVAL');
                    clearInterval(exports.battleLoops[user.characterId]);
                    console.log('INTERVAL CLOSED');
                    return;
                }
            }), 1500);
            exports.battleLoops[user.characterId] = basicFight;
            return { script: '', user, field: 'action', cooldown: Date.now() - 2000 };
        });
        this.reEncounter = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            // 던전 진행상황 불러오기
            const { characterId } = user;
            let dungeonSession = yield config_1.default.hGetAll(String(characterId));
            const dungeonLevel = Number(dungeonSession.dungeonLevel);
            let tempScript = '';
            const tempLine = '=======================================================================\n';
            // 적 생성
            const newMonster = yield services_1.MonsterService.createNewMonster(dungeonLevel, characterId);
            tempScript += `너머에 ${newMonster.name}의 그림자가 보인다\n\n`;
            tempScript += `[공격] 하기\n`;
            tempScript += `[도망] 가기\n`;
            // 던전 진행상황 업데이트
            dungeonSession = {
                dungeonLevel: String(dungeonLevel),
                monsterId: String(newMonster.monsterId),
            };
            yield config_1.default.hSet(String(user.characterId), dungeonSession);
            const script = tempLine + tempScript;
            const field = 'encounter';
            user = yield services_1.CharacterService.addExp(characterId, 0);
            return { script, user, field };
        });
        this.run = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            console.log('도망 실행');
            const dungeonSession = yield config_1.default.hGetAll(String(user.characterId));
            let tempScript = '';
            const tempLine = '=======================================================================\n';
            tempScript += `... 몬스터와 눈이 마주친 순간,\n`;
            tempScript += `당신은 던전 입구를 향해 필사적으로 뒷걸음질쳤습니다.\n\n`;
            tempScript += `??? : 하남자특. 도망감.\n\n`;
            tempScript += `목록 - 던전 목록을 불러옵니다.\n`;
            tempScript += `입장 [number] - 선택한 번호의 던전에 입장합니다.\n\n`;
            // 몬스터 삭제
            // await MonsterService.destroyMonster(Number(dungeonSession.monsterId));
            yield config_1.default.hDel(String(user.userId), 'monsterId');
            const script = tempLine + tempScript;
            const field = 'dungeon';
            return { script, user, field };
        });
        this.ewrongCommand = (CMD, user) => {
            let tempScript = '';
            tempScript += `입력값을 확인해주세요.\n`;
            tempScript += `현재 입력 : '${CMD}'\n`;
            tempScript += `사용가능한 명령어가 궁금하시다면 '도움말'을 입력해보세요.\n`;
            const script = 'Error : \n' + tempScript;
            const field = 'encounter';
            return { script, user, field };
        };
    }
}
;
exports.battleLoops = {};
exports.default = new EncounterHandler();
