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
const config_1 = __importDefault(require("../../db/redis/config"));
const models_1 = require("../../db/models");
const services_1 = require("../../services");
const _1 = __importDefault(require("."));
exports.default = {
    // help: (CMD: string | undefined, user: UserSession) => {}
    help: (CMD, user) => {
        let tempScript = '';
        const tempLine = '=======================================================================\n';
        tempScript += '명령어 : \n';
        tempScript += '[수동] 전투 진행 - 수동 전투를 진행합니다.\n';
        tempScript += '[자동] 전투 진행 - 자동 전투를 진행합니다.\n';
        tempScript += '[돌]아가기 - 이전 단계로 돌아갑니다.\n';
        const script = tempLine + tempScript;
        const field = 'battle';
        return { script, user, field };
    },
    manualLogic: (CMD, user) => __awaiter(void 0, void 0, void 0, function* () {
        let tempScript = '';
        let dead;
        let field = 'action';
        const { characterId } = user;
        // 유저&몬스터 정보 불러오기
        const { hp: playerHP, attack: playerDamage } = yield services_1.CharacterService.findByPk(characterId);
        const { monsterId } = yield config_1.default.hGetAll(String(characterId));
        const monster = yield models_1.Monsters.findByPk(monsterId);
        if (!monster)
            throw new Error('몬스터 정보 불러오기 실패');
        const { name: monsterName, hp: monsterHP, attack: monsterDamage, exp: monsterExp } = monster;
        // 유저 턴
        console.log('유저턴');
        const playerHit = services_1.BattleService.hitStrength(playerDamage);
        const playerAdjective = services_1.BattleService.dmageAdjective(playerHit, playerDamage);
        tempScript += `\n당신의 ${playerAdjective} 공격이 ${monsterName}에게 적중했다. => ${playerHit}의 데미지!\n`;
        const isDead = yield services_1.MonsterService.refreshStatus(+monsterId, playerHit, characterId);
        if (!isDead)
            throw new Error('몬스터 정보를 찾을 수 없습니다');
        if (isDead === 'dead') {
            console.log('몬스터 사망');
            return yield _1.default.resultMonsterDead(monster, tempScript);
        }
        // 몬스터 턴
        console.log('몬스터 턴');
        const monsterHit = services_1.BattleService.hitStrength(monsterDamage);
        const monsterAdjective = services_1.BattleService.dmageAdjective(monsterHit, monsterDamage);
        tempScript += `${monsterName} 이(가) 당신에게 ${monsterAdjective} 공격! => ${monsterHit}의 데미지!\n`;
        user = yield services_1.CharacterService.refreshStatus(characterId, monsterHit, 0, +monsterId);
        if (user.isDead === 'dead') {
            console.log('유저 사망');
            field = 'adventureResult';
            tempScript += '\n!! 치명상 !!\n';
            tempScript += `당신은 ${monsterName}의 공격을 버티지 못했습니다.. \n`;
            dead = 'player';
        }
        const script = tempScript;
        return { script, user, field, dead };
    }),
    skill: (CMD, user) => __awaiter(void 0, void 0, void 0, function* () {
        let tempScript = '';
        let dead = '';
        const { characterId } = user;
        const dungeonData = yield config_1.default.hGetAll(String(characterId));
        const characterStatus = yield models_1.Characters.findByPk(characterId);
        const playerDamage = characterStatus.attack;
        const playerMP = characterStatus.mp;
        // 임시 플레이어 스킬목록
        const plsyerskills = [
            { name: '컬랩스', damage: 115, cost: 25 },
            { name: '파이어', damage: 130, cost: 50 },
            { name: '파이라', damage: 150, cost: 100 },
            { name: '파이쟈', damage: 200, cost: 300 },
        ];
        const monsterId = Number(dungeonData.monsterId);
        const monster = yield models_1.Monsters.findByPk(monsterId);
        const monsterName = monster.name;
        const monsterHP = monster.hp;
        const monsterExp = monster.exp;
        // 스킬 선택
        const selectedSkill = plsyerskills[Number(CMD) - 1];
        const skillName = selectedSkill.name;
        const damageRate = selectedSkill.damage;
        const skillCost = selectedSkill.cost;
        // 사용가능 마나 소지여부 확인
        if (playerMP - skillCost < 0) {
            tempScript += `??? : 비전력이 부조카당.\n`;
        }
        else {
            // 스킬 데미지 계산
            const playerSkillDamage = Math.floor((playerDamage * damageRate) / 100);
            const realDamage = services_1.BattleService.hitStrength(playerSkillDamage);
            // 스킬 Cost 적용
            user = (yield services_1.CharacterService.refreshStatus(characterId, 0, 0, +monsterId)) || user;
            tempScript += `\n당신의 ${skillName} 스킬이 ${monsterName}에게 적중! => ${realDamage}의 데미지!\n`;
            // 몬스터 데미지 적용
            if (monsterHP - realDamage > 0) {
                console.log('몬스터 체력 감소 반영');
                yield services_1.MonsterService.refreshStatus(monsterId, realDamage, characterId);
            }
            else {
                console.log('몬스터 사망');
                // await MonsterService.destroyMonster(Number(dungeonData.monsterId));
                yield config_1.default.hDel(String(characterId), 'monsterId');
                user = (yield services_1.CharacterService.addExp(characterId, monsterExp)) || user;
                dead = 'monster';
                tempScript += `\n${monsterName} 은(는) 쓰러졌다 ! => Exp + ${monsterExp}\n`;
                // 레벨 업 이벤트 발생
                if (user.levelup) {
                    tempScript += `\n==!! LEVEL UP !! 레벨이 ${user.level - 1} => ${user.level} 올랐습니다 !! LEVEL UP !!==\n\n`;
                }
            }
        }
        const script = tempScript;
        const field = 'encounter';
        return { script, user, field, dead };
    }),
    resultMonsterDead: (monster, script) => __awaiter(void 0, void 0, void 0, function* () {
        const { characterId, name: monsterName, exp: monsterExp } = monster;
        const user = yield services_1.CharacterService.addExp(characterId, monsterExp);
        const field = 'encounter';
        script += `\n${monsterName} 은(는) 쓰러졌다 ! => Exp + ${monsterExp}\n`;
        const dead = 'monster';
        if (user.levelup) {
            script += `\n==!! LEVEL UP !! 레벨이 ${user.level - 1} => ${user.level} 올랐습니다 !! LEVEL UP !!==\n\n`;
        }
        return { script, user, field, dead };
    }),
    auto: (CMD, user) => {
        const script = 'tempScript';
        const field = 'home';
        return { script, user, field };
    },
    wrongCommand: (CMD, user) => {
        let tempScript = '';
        tempScript += `입력값을 확인해주세요.\n`;
        tempScript += `현재 입력 : '${CMD}'\n`;
        tempScript += `사용가능한 명령어가 궁금하시다면 '도움말'을 입력해보세요.\n`;
        const script = 'Error : \n' + tempScript;
        const field = 'battle';
        return { script, user, field };
    },
};
