import type { AbilityKey, ChoiceTemplate } from '@/types';

/**
 * Moments the day stops on. The player picks; the survivor's ability decides
 * whether it works. Every option can fail, and failing is never the same as
 * doing nothing — that is what makes the pick feel like a decision.
 */
export const CHOICE_TEMPLATES: readonly ChoiceTemplate[] = [
  {
    id: 'lockedPharmacy',
    prompt: '{생존자}가 셔터 내려진 약국 앞에 섰다. 안쪽에 약통이 보인다.',
    options: [
      {
        id: 'pry',
        label: '지렛대로 셔터를 들어올린다',
        ability: 'strength',
        difficulty: 5,
        success: {
          text: '{생존자}가 셔터를 한 뼘 들어올렸다. 항생제 두 통을 꺼냈다.',
          items: [{ itemId: 'antibiotics', quantity: 2 }],
          actor: { stamina: -10 },
        },
        failure: {
          text: '셔터는 꿈쩍하지 않았다. {생존자}가 어깨를 접질렸다.',
          actor: { hp: -12, stamina: -12 },
        },
      },
      {
        id: 'backdoor',
        label: '뒷문 자물쇠를 살펴본다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 경첩을 풀었다. 소독약과 붕대를 챙겼다.',
          items: [
            { itemId: 'antiseptic', quantity: 1 },
            { itemId: 'bandage', quantity: 2 },
          ],
        },
        failure: {
          text: '뒷문은 안쪽에서 막혀 있었다. 시간만 버렸다.',
          actor: { stamina: -8, morale: -4 },
        },
      },
      {
        id: 'leave',
        label: '그냥 지나친다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 약국을 지나쳤다. 뒤를 한 번 돌아봤다.',
          actor: { morale: -3 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'hordeInStreet',
    prompt: '길 한복판에 무리가 있다. {생존자}가 먼저 봤다.',
    options: [
      {
        id: 'sneak',
        label: '건물을 끼고 돌아간다',
        ability: 'agility',
        difficulty: 5,
        success: {
          text: '{생존자}가 벽을 따라 돌았다. 아무도 눈치채지 못했다.',
          actor: { stamina: -8 },
        },
        failure: {
          text: '{생존자}가 유리를 밟았다. 달리는 수밖에 없었다.',
          actor: { stamina: -22, hp: -8 },
        },
      },
      {
        id: 'fight',
        label: '길을 뚫는다',
        ability: 'strength',
        difficulty: 6,
        success: {
          text: '{생존자}가 앞의 셋을 넘어뜨리고 길을 냈다.',
          actor: { stamina: -18, morale: 5 },
          everyone: { morale: 4 },
        },
        failure: {
          text: '{생존자}가 물렸다. 소매를 내리고 돌아왔다.',
          actor: { hp: -14, stamina: -18 },
          infect: 78,
        },
      },
      {
        id: 'wait',
        label: '해가 질 때까지 기다린다',
        ability: 'endurance',
        difficulty: 4,
        success: {
          text: '{생존자}가 배수구에서 네 시간을 버텼다. 무리는 흩어졌다.',
          actor: { stamina: -12, hunger: 8 },
        },
        failure: {
          text: '{생존자}가 다리에 감각을 잃고 움직였다. 소리가 났다.',
          actor: { stamina: -20, hp: -6 },
        },
      },
    ],
  },
  {
    id: 'strangerAtGate',
    prompt: '{생존자} 앞에 낯선 사람이 서 있다. 다쳤고, 무장은 없다.',
    options: [
      {
        id: 'admit',
        label: '들인다',
        ability: 'intellect',
        difficulty: 6,
        success: {
          text: '낯선 사람이 지도를 내놓았다. 거짓은 없어 보였다.',
          items: [{ itemId: 'map', quantity: 1 }],
          everyone: { morale: 5 },
        },
        failure: {
          text: '아침에 통조림 두 개가 사라져 있었다. 그 사람도 없었다.',
          items: [{ itemId: 'cannedFood', quantity: -2 }],
          everyone: { morale: -8 },
        },
      },
      {
        id: 'trade',
        label: '문 앞에서 물건만 바꾼다',
        ability: 'luck',
        difficulty: 5,
        success: {
          text: '{생존자}가 담 너머로 물을 건넸다. 건전지가 돌아왔다.',
          items: [{ itemId: 'battery', quantity: 2 }],
        },
        failure: {
          text: '거래는 틀어졌다. 낯선 사람이 침을 뱉고 돌아섰다.',
          actor: { morale: -6 },
        },
      },
      {
        id: 'refuse',
        label: '돌려보낸다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 문을 닫았다. 두드리는 소리는 오래 이어졌다.',
          everyone: { morale: -6 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'lastAntibiotic',
    prompt: '항생제가 한 통 남았다. 열이 오른 사람은 둘이다.',
    options: [
      {
        id: 'giveOther',
        label: '{상대}에게 준다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 마지막 항생제를 {상대}에게 넘겼다.',
          target: { infection: -30 },
          actor: { morale: -4 },
          trust: 14,
          items: [{ itemId: 'antibiotics', quantity: -1 }],
        },
        failure: { text: '' },
      },
      {
        id: 'keep',
        label: '{생존자}가 쓴다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 스스로에게 썼다. {상대}는 아무 말도 하지 않았다.',
          actor: { infection: -30 },
          trust: -18,
          items: [{ itemId: 'antibiotics', quantity: -1 }],
        },
        failure: { text: '' },
      },
      {
        id: 'split',
        label: '반씩 나눈다',
        ability: 'intellect',
        difficulty: 6,
        success: {
          text: '{생존자}가 용량을 나눴다. 둘 다 열이 조금 내렸다.',
          actor: { infection: -15 },
          target: { infection: -15 },
          trust: 6,
          items: [{ itemId: 'antibiotics', quantity: -1 }],
        },
        failure: {
          text: '나눈 양은 둘 다에게 모자랐다. 열은 그대로였다.',
          everyone: { morale: -6 },
          items: [{ itemId: 'antibiotics', quantity: -1 }],
        },
      },
    ],
  },
  {
    id: 'noiseAtNight',
    prompt: '새벽에 지하에서 소리가 났다. {생존자}가 깨어 있었다.',
    options: [
      {
        id: 'checkAlone',
        label: '혼자 내려가 본다',
        ability: 'agility',
        difficulty: 6,
        success: {
          text: '{생존자}가 확인하고 올라왔다. 쥐였다. 아무도 깨우지 않았다.',
          actor: { stamina: -6 },
        },
        failure: {
          text: '{생존자}가 계단에서 굴렀다. 소리가 집 전체에 울렸다.',
          actor: { hp: -10 },
          everyone: { morale: -6 },
        },
      },
      {
        id: 'wakeAll',
        label: '전부 깨운다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 모두를 깨웠다. 아무 일도 없었고, 아무도 다시 잠들지 못했다.',
          everyone: { stamina: -8, morale: -3 },
        },
        failure: { text: '' },
      },
      {
        id: 'ignore',
        label: '못 들은 척한다',
        ability: 'luck',
        difficulty: 5,
        success: {
          text: '{생존자}가 돌아누웠다. 아침까지 아무 일도 없었다.',
          actor: { morale: -2 },
        },
        failure: {
          text: '문이 열려 있었다. 통조림 세 개가 없어졌다.',
          items: [{ itemId: 'cannedFood', quantity: -3 }],
          everyone: { morale: -7 },
        },
      },
    ],
  },
  {
    id: 'floodedBasement',
    prompt: '물에 잠긴 지하 창고가 있다. 안에 상자가 보인다.',
    options: [
      {
        id: 'dive',
        label: '{생존자}가 들어간다',
        ability: 'endurance',
        difficulty: 6,
        success: {
          text: '{생존자}가 상자 두 개를 건져 올렸다. 손이 오래 떨렸다.',
          items: [
            { itemId: 'cannedFood', quantity: 4 },
            { itemId: 'bottledWater', quantity: 3 },
          ],
          actor: { stamina: -20, hp: -5 },
        },
        failure: {
          text: '{생존자}가 반쯤 들어갔다가 되돌아 나왔다. 아무것도 못 건졌다.',
          actor: { stamina: -18, hp: -8, morale: -5 },
        },
      },
      {
        id: 'hook',
        label: '밧줄로 끌어낸다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 갈고리를 만들어 상자를 끌어냈다.',
          items: [{ itemId: 'cannedFood', quantity: 3 }],
          actor: { stamina: -8 },
        },
        failure: {
          text: '밧줄이 끊겼다. 상자는 더 깊이 가라앉았다.',
          items: [{ itemId: 'rope', quantity: -1 }],
          actor: { morale: -5 },
        },
      },
      {
        id: 'skip',
        label: '내버려 둔다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 문을 닫았다. 물 냄새가 며칠 갔다.',
          actor: { morale: -2 },
        },
        failure: { text: '' },
      },
    ],
  },

  /* ======================================================================
     Second pass. Six prompts was not enough to carry a run past a few weeks,
     and the draw had no memory, so the same three kept coming back.
     ====================================================================== */

  {
    id: 'generatorFuel',
    prompt: '발전기 연료가 하루치 남았다. {생존자}가 계기판을 들여다본다.',
    options: [
      {
        id: 'siphon',
        label: '차에서 기름을 뽑아 온다',
        ability: 'agility',
        difficulty: 5,
        success: {
          text: '{생존자}가 호스로 기름을 옮겼다. 사흘은 더 돌아간다.',
          everyone: { morale: 8 },
          actor: { stamina: -12 },
        },
        failure: {
          text: '{생존자}가 기름을 마셨다가 게워냈다. 통은 반쯤 엎질러졌다.',
          actor: { hp: -10, stamina: -14, morale: -8 },
        },
      },
      {
        id: 'ration',
        label: '밤에만 켠다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 낮 동안 전원을 내렸다. 냉장고 안이 미지근해졌다.',
          everyone: { morale: -4 },
        },
        failure: { text: '' },
      },
      {
        id: 'shutOff',
        label: '아예 끈다',
        ability: null,
        difficulty: 0,
        success: {
          text: '발전기가 멎었다. 처음으로 밖의 소리가 전부 들렸다.',
          everyone: { morale: -9, stamina: -4 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'woundedLimb',
    prompt: '{생존자}의 팔이 검게 변하고 있다. 물린 자국은 어제 것이다.',
    options: [
      {
        id: 'amputate',
        label: '잘라낸다',
        ability: 'intellect',
        difficulty: 7,
        success: {
          text: '{생존자}의 팔을 잘랐다. 지혈까지 십일 분이 걸렸다.',
          actor: { hp: -28, infection: -60, morale: -12 },
          everyone: { morale: -8 },
        },
        failure: {
          text: '피가 멎지 않았다. {생존자}는 아침까지 의식을 잃었다 되찾기를 반복했다.',
          actor: { hp: -34, infection: -20, morale: -18 },
          everyone: { morale: -12 },
        },
      },
      {
        id: 'burn',
        label: '지진다',
        ability: 'endurance',
        difficulty: 6,
        success: {
          text: '{생존자}가 이를 악물었다. 냄새가 하루 종일 빠지지 않았다.',
          actor: { hp: -14, infection: -30, morale: -10 },
        },
        failure: {
          text: '{생존자}가 몸부림쳤고, 인두가 엉뚱한 데 닿았다.',
          actor: { hp: -22, infection: -10, morale: -14 },
        },
      },
      {
        id: 'waitOut',
        label: '지켜본다',
        ability: null,
        difficulty: 0,
        success: {
          text: '아무도 아무 말도 하지 않았다. {생존자}는 소매를 내렸다.',
          actor: { morale: -6 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'sickChild',
    prompt: '담 밖에서 우는 소리가 이틀째다. {생존자}가 창문을 열었다.',
    options: [
      {
        id: 'goOut',
        label: '나가 본다',
        ability: 'luck',
        difficulty: 6,
        success: {
          text: '{생존자}가 아이를 데려왔다. 배낭에 통조림이 여섯 개 있었다.',
          items: [{ itemId: 'cannedFood', quantity: 6 }],
          everyone: { morale: 10 },
        },
        failure: {
          text: '우는 소리는 녹음이었다. {생존자}가 겨우 문까지 돌아왔다.',
          actor: { hp: -16, stamina: -20 },
          everyone: { morale: -10 },
        },
      },
      {
        id: 'watch',
        label: '창가에서 지켜본다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 세 시간을 봤다. 어른 둘이 골목에 서 있었다.',
          actor: { stamina: -8 },
          everyone: { morale: -3 },
        },
        failure: {
          text: '{생존자}가 졸았다. 아침에 담 밑에 발자국이 여럿 나 있었다.',
          everyone: { morale: -8 },
        },
      },
      {
        id: 'closeWindow',
        label: '창문을 닫는다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 창문을 닫고 커튼까지 쳤다. 소리는 계속 들렸다.',
          everyone: { morale: -7 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'rooftopSignal',
    prompt: '옥상에서 불을 피우면 멀리서도 보인다. 누가 볼지는 모른다.',
    options: [
      {
        id: 'signal',
        label: '불을 피운다',
        ability: 'luck',
        difficulty: 6,
        success: {
          text: '밤사이 담 앞에 상자가 놓였다. 쪽지에는 아무 말도 없었다.',
          items: [
            { itemId: 'cannedFood', quantity: 5 },
            { itemId: 'bandage', quantity: 2 },
          ],
          everyone: { morale: 12 },
        },
        failure: {
          text: '새벽에 무리가 몰려왔다. 불은 사흘 만에 꺼졌다.',
          everyone: { hp: -10, stamina: -16, morale: -10 },
        },
      },
      {
        id: 'mirror',
        label: '낮에 거울로만 신호한다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 각도를 맞췄다. 건너편 옥상에서 두 번 반짝였다.',
          everyone: { morale: 9 },
        },
        failure: {
          text: '{생존자}가 반나절을 흔들었다. 아무 대답도 없었다.',
          actor: { stamina: -10, morale: -6 },
        },
      },
      {
        id: 'stayDark',
        label: '아무것도 하지 않는다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 성냥을 도로 넣었다. 오늘도 아무도 우리를 모른다.',
          everyone: { morale: -4 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'foodSpoiling',
    prompt: '통조림 한 무더기가 부풀어 있다. 먹을 것은 이것뿐이다.',
    options: [
      {
        id: 'boil',
        label: '오래 끓여 먹는다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 한 시간을 끓였다. 아무도 탈이 나지 않았다.',
          everyone: { hunger: -20 },
        },
        failure: {
          text: '밤새 둘이 번갈아 화장실을 갔다.',
          everyone: { hp: -8, stamina: -12, morale: -6 },
        },
      },
      {
        id: 'feedOne',
        label: '{생존자}가 먼저 먹어 본다',
        ability: 'endurance',
        difficulty: 5,
        success: {
          text: '{생존자}가 한 통을 비웠다. 두 시간 뒤에도 멀쩡했다.',
          actor: { hunger: -25, morale: 6 },
          everyone: { morale: 5 },
        },
        failure: {
          text: '{생존자}가 밤새 앓았다. 나머지는 손도 대지 않았다.',
          actor: { hp: -14, stamina: -16 },
          everyone: { morale: -6 },
        },
      },
      {
        id: 'dump',
        label: '전부 버린다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 전부 파묻었다. 오늘 저녁은 없다.',
          items: [{ itemId: 'cannedFood', quantity: -4 }],
          everyone: { hunger: 12, morale: -5 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'accusation',
    prompt: '{생존자}가 {상대}의 가방에서 숨겨둔 배급을 찾아냈다.',
    options: [
      {
        id: 'confront',
        label: '전부 앞에서 꺼낸다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 가방을 뒤집어 쏟았다. {상대}는 변명하지 않았다.',
          trust: -22,
          everyone: { morale: -8 },
        },
        failure: { text: '' },
      },
      {
        id: 'privately',
        label: '{상대}에게만 말한다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 조용히 돌려놓게 했다. 아무도 몰랐다.',
          trust: 10,
          actor: { morale: -3 },
        },
        failure: {
          text: '{상대}가 목소리를 높였고, 결국 전부가 알게 됐다.',
          trust: -14,
          everyone: { morale: -6 },
        },
      },
      {
        id: 'sayNothing',
        label: '못 본 척한다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 가방을 원래대로 닫았다. 그날 이후 눈을 마주치지 않았다.',
          trust: -6,
          actor: { morale: -8 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'movingOn',
    prompt: '북쪽에 대피소가 있다는 말이 있다. 여기 물자는 두 주치다.',
    options: [
      {
        id: 'goNorth',
        label: '전부 짐을 싸서 떠난다',
        ability: 'endurance',
        difficulty: 6,
        success: {
          text: '나흘을 걸었다. 대피소는 비어 있었지만, 창고는 아니었다.',
          items: [
            { itemId: 'cannedFood', quantity: 8 },
            { itemId: 'bottledWater', quantity: 8 },
          ],
          everyone: { stamina: -20, morale: 8 },
        },
        failure: {
          text: '이틀 만에 되돌아왔다. 그사이 창고가 털려 있었다.',
          items: [{ itemId: 'cannedFood', quantity: -5 }],
          everyone: { stamina: -24, morale: -12 },
        },
      },
      {
        id: 'scoutFirst',
        label: '{생존자}가 먼저 정찰한다',
        ability: 'agility',
        difficulty: 5,
        success: {
          text: '{생존자}가 하루 만에 돌아왔다. 길은 막혀 있었다. 가지 않기로 했다.',
          actor: { stamina: -18 },
          everyone: { morale: 4 },
        },
        failure: {
          text: '{생존자}가 사흘 만에 절뚝이며 돌아왔다. 아무것도 확인하지 못했다.',
          actor: { hp: -18, stamina: -24 },
          everyone: { morale: -8 },
        },
      },
      {
        id: 'stay',
        label: '여기 남는다',
        ability: null,
        difficulty: 0,
        success: {
          text: '아무도 더 말을 꺼내지 않았다. 북쪽 얘기는 그것으로 끝났다.',
          everyone: { morale: -5 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'dogAtGate',
    prompt: '개 한 마리가 담 밑에서 사흘째 자고 있다. 마르긴 했지만 물지는 않는다.',
    options: [
      {
        id: 'keep',
        label: '안으로 들인다',
        ability: 'luck',
        difficulty: 4,
        success: {
          text: '개가 밤마다 문 쪽을 보고 짖었다. 두 번은 진짜였다.',
          everyone: { morale: 14, hunger: 5 },
        },
        failure: {
          text: '개가 사흘 뒤 사라졌다. 통조림 두 개도 같이.',
          items: [{ itemId: 'cannedFood', quantity: -2 }],
          everyone: { morale: -8 },
        },
      },
      {
        id: 'feedOutside',
        label: '밖에서만 먹인다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 담 밑에 그릇을 놓았다. 이름은 붙이지 않기로 했다.',
          items: [{ itemId: 'cannedFood', quantity: -1 }],
          everyone: { morale: 6 },
        },
        failure: { text: '' },
      },
      {
        id: 'driveOff',
        label: '쫓아낸다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 돌을 던졌다. 개는 두 번 돌아봤다.',
          actor: { morale: -10 },
          everyone: { morale: -4 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'radioVoice',
    prompt: '무전기에서 좌표를 부르는 목소리가 잡혔다. 여자 목소리고, 반복된다.',
    options: [
      {
        id: 'answer',
        label: '응답한다',
        ability: 'luck',
        difficulty: 6,
        success: {
          text: '대답이 돌아왔다. 서른 명이 남아 있고, 벽이 있다고 했다.',
          everyone: { morale: 16 },
        },
        failure: {
          text: '응답한 순간 목소리가 끊겼다. 그날 밤 담 밖에 사람이 서 있었다.',
          everyone: { morale: -12 },
        },
      },
      {
        id: 'listen',
        label: '듣기만 한다',
        ability: 'intellect',
        difficulty: 5,
        success: {
          text: '{생존자}가 좌표를 받아 적었다. 사흘 뒤 목소리는 끊겼다.',
          items: [{ itemId: 'map', quantity: 1 }],
          everyone: { morale: 6 },
        },
        failure: {
          text: '잡음뿐이었다. {생존자}가 건전지만 태웠다.',
          items: [{ itemId: 'battery', quantity: -1 }],
          actor: { morale: -5 },
        },
      },
      {
        id: 'switchOff',
        label: '끈다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}가 스위치를 내렸다. 아무도 다시 켜자고 하지 않았다.',
          everyone: { morale: -6 },
        },
        failure: { text: '' },
      },
    ],
  },
  {
    id: 'watchTogether',
    prompt: '오늘 밤 당번은 하나로 충분하다. {생존자}와 {상대}가 둘 다 남았다.',
    options: [
      {
        id: 'together',
        label: '둘이 같이 선다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{생존자}와 {상대}가 아침까지 이야기했다. 둘 다 못 잤고, 둘 다 괜찮아 보였다.',
          trust: 20,
          actor: { stamina: -12 },
          target: { stamina: -12 },
        },
        failure: { text: '' },
      },
      {
        id: 'takeIt',
        label: '{생존자}가 혼자 선다',
        ability: 'endurance',
        difficulty: 5,
        success: {
          text: '{생존자}가 밤을 다 썼다. 아침에 {상대}가 커피를 끓여 왔다.',
          trust: 12,
          actor: { stamina: -18 },
          target: { stamina: 8 },
        },
        failure: {
          text: '{생존자}가 새벽에 졸았다. 다행히 아무 일도 없었다.',
          actor: { stamina: -14, morale: -8 },
        },
      },
      {
        id: 'coinToss',
        label: '동전으로 정한다',
        ability: 'luck',
        difficulty: 5,
        success: {
          text: '{상대}가 졌다. 웃으면서 졌다.',
          trust: 6,
          target: { stamina: -14 },
        },
        failure: {
          text: '동전이 배수구로 굴러갔다. 결국 둘 다 안 잤다.',
          actor: { stamina: -14 },
          target: { stamina: -14 },
          trust: -4,
        },
      },
    ],
  },
  {
    id: 'frozenPipes',
    prompt: '수도관이 얼어 터졌다. 물은 오늘 아침이 마지막이었다.',
    options: [
      {
        id: 'meltSnow',
        label: '눈을 녹여 쓴다',
        ability: 'endurance',
        difficulty: 4,
        success: {
          text: '{생존자}가 하루 종일 냄비를 지켰다. 여섯 통을 채웠다.',
          items: [{ itemId: 'bottledWater', quantity: 6 }],
          actor: { stamina: -16 },
        },
        failure: {
          text: '땔감이 먼저 떨어졌다. 반 통도 못 채웠다.',
          items: [{ itemId: 'bottledWater', quantity: 1 }],
          everyone: { morale: -8 },
        },
      },
      {
        id: 'repair',
        label: '관을 고친다',
        ability: 'intellect',
        difficulty: 6,
        success: {
          text: '{생존자}가 이음매를 감았다. 물이 다시 나왔다.',
          items: [{ itemId: 'bottledWater', quantity: 10 }],
          everyone: { morale: 10 },
        },
        failure: {
          text: '{생존자}가 관을 더 벌려놓았다. 지하가 젖었다.',
          actor: { morale: -10 },
          everyone: { morale: -6 },
        },
      },
      {
        id: 'goRiver',
        label: '강까지 다녀온다',
        ability: 'agility',
        difficulty: 6,
        success: {
          text: '{생존자}가 통 네 개를 지고 왔다. 어깨가 까졌다.',
          items: [{ itemId: 'bottledWater', quantity: 8 }],
          actor: { stamina: -22, hp: -5 },
        },
        failure: {
          text: '강가에 이미 사람들이 있었다. {생존자}가 빈손으로 뛰었다.',
          actor: { stamina: -24, hp: -12 },
        },
      },
    ],
  },
  {
    id: 'weakestLink',
    prompt: '{상대}가 사흘째 일어나지 못한다. 옮기면 모두가 느려진다.',
    options: [
      {
        id: 'carry',
        label: '업고 간다',
        ability: 'strength',
        difficulty: 6,
        success: {
          text: '{생존자}가 {상대}를 업었다. 아무도 속도 얘기를 꺼내지 않았다.',
          trust: 24,
          actor: { stamina: -22 },
          target: { hp: 8, morale: 14 },
          everyone: { morale: 5 },
        },
        failure: {
          text: '{생존자}가 두 번 넘어졌다. 세 번째에는 {상대}가 내려달라고 했다.',
          trust: 8,
          actor: { stamina: -24, hp: -8 },
          target: { hp: -8, morale: -10 },
        },
      },
      {
        id: 'stayPut',
        label: '나을 때까지 여기 머문다',
        ability: null,
        difficulty: 0,
        success: {
          text: '전부 나흘을 더 머물렀다. {상대}는 겨우 앉게 됐고, 창고는 비었다.',
          items: [{ itemId: 'cannedFood', quantity: -6 }],
          target: { hp: 16 },
          everyone: { hunger: 10 },
        },
        failure: { text: '' },
      },
      {
        id: 'leaveBehind',
        label: '{상대}를 두고 간다',
        ability: null,
        difficulty: 0,
        success: {
          text: '{상대}에게 물 두 통을 남겼다. 문은 밖에서 닫혔다.',
          trust: -40,
          target: { hp: -20, morale: -30 },
          everyone: { morale: -16 },
        },
        failure: { text: '' },
      },
    ],
  },
];

/** 5 is average; each point moves the odds by 9 points. */
export const successChance = (
  ability: AbilityKey | null,
  score: number,
  difficulty: number,
): number => {
  if (ability === null) return 1;
  const base = 0.5 + (score - difficulty) * 0.09;
  return Math.min(0.95, Math.max(0.1, base));
};
