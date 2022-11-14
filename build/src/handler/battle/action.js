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
const models_1 = require("../../db/models");
const services_1 = require("../../services");
const config_1 = __importDefault(require("../../db/redis/config"));
const encounter_Handler_1 = require("./encounter.Handler");
const battle_1 = __importDefault(require("../battle"));
class BattleAction {
    constructor() {
        this.actionSkill = (CMD, user) => __awaiter(this, void 0, void 0, function* () {
            let tempScript = '';
            let dead = undefined;
            let field = 'action';
            const { characterId } = user;
            // 스킬 정보 가져오기
            const { attack, mp, skill } = yield services_1.CharacterService.findByPk(characterId);
            if (skill[Number(CMD) - 1] === undefined) {
                const result = battle_1.default.wrongCommand(CMD, user);
                return {
                    script: result.script,
                    user: result.user,
                    field: result.field,
                    error: true
                };
            }
            const { name: skillName, cost, multiple } = skill[Number(CMD) - 1];
            // 몬스터 정보 가져오기
            const { monsterId } = yield config_1.default.hGetAll(String(characterId));
            const monster = yield models_1.Monsters.findByPk(monsterId);
            if (!monster)
                throw new Error('몬스터 정보가 없습니다.');
            /**
             * 몬스터 정보 없을시 에러가 아닌 일반 공격에 의한 사망으로 간주
             * 혹은 버그/사망 판별 가능?
             */
            const { name: monsterName, hp: monsterHp, exp: monsterExp } = monster;
            // 마나 잔여량 확인
            if (mp - cost < 0) {
                tempScript += `??? : 비전력이 부조카당.\n`;
                const script = tempScript;
                return { script, user, field };
            }
            // 스킬 데미지 계산
            const playerSkillDamage = Math.floor((attack * multiple) / 100);
            const realDamage = services_1.BattleService.hitStrength(playerSkillDamage);
            // 스킬 Cost 적용
            user = yield services_1.CharacterService.refreshStatus(characterId, 0, cost, +monsterId);
            tempScript += `\n당신의 ${skillName} 스킬이 ${monsterName}에게 적중! => ${realDamage}의 데미지!\n`;
            // 몬스터에게 스킬 데미지 적용 
            const isDead = yield services_1.MonsterService.refreshStatus(+monsterId, realDamage, characterId);
            if (!isDead)
                throw new Error('몬스터 정보를 찾을 수 없습니다');
            if (isDead === 'dead') {
                console.log('몬스터 사망');
                clearInterval(encounter_Handler_1.battleLoops[characterId]);
                console.log('LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOP CLEARED');
                return yield battle_1.default.resultMonsterDead(monster, tempScript);
            }
            const script = tempScript;
            return { script, user, field, dead };
        });
    }
}
exports.default = new BattleAction();
