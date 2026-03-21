---
captured: 2026-03-21 01:39:27
source: clipboard
status: unprocessed
---

모바일 텍스트 선택지 게임들은 “텍스트 표시 방식 + 선택 인터랙션 + 진행 피드백 UI” 조합으로 장르별 특색을 만들고, 특히 **카드 스와이프형(Reigns)**, **지도 기반(80 Days, Sorcery!)**, **채팅형(Lifeline)**, **비주얼 노블형(Choices, Episode)**, **완전 자유 입력형(AI Dungeon)** 등으로 뚜렷하게 갈립니다.[1][2][3][4][5][6]

아래에서 앱별로 요청한 6가지 축으로 정리하고, 마지막에 공통 패턴/차이를 요약합니다.

***

## Lifeline

1. **텍스트 표시 방식**  
   - 게임 전체가 SMS 형식의 짧은 메시지로 진행되며, 화면에는 Taylor가 보낸 텍스트가 채팅처럼 순차적으로 쌓이는 구조입니다.[7][8]
   - 실시간 지연이 포함되어 있어 “Taylor is busy” 같은 상태 메시지가 뜨고 한동안 아무 메시지도 안 오다가 다시 도착하는 식으로, 실제 문자를 기다리는 감각을 UI로 구현합니다.[9][10]

2. **선택지 UI**  
   - 거의 항상 **이항 선택(2지선다)**로, 각 메시지 뒤에 두 개의 짧은 답변 옵션이 버튼처럼 제시되고 그 중 하나를 누르는 구조입니다.[10][11]

3. **캐릭터 표현**  
   - Taylor는 텍스트로만 존재하며, 인게임에서 얼굴 일러스트나 스프라이트는 등장하지 않고 **목소리와 말투만으로 캐릭터성**을 구축합니다.[8][10]

4. **진행 피드백(스탯/지도 등)**  
   - 별도의 수치 스탯, 지도, 타임라인 UI는 없고, **Taylor의 상황 변화와 실시간 경과(“몇 시간 후에 다시 메시지”) 자체가 진행 피드백** 역할을 합니다.[7][10]

5. **배경/분위기(색/일러/사운드)**  
   - UI는 매우 미니멀하고 그래픽은 거의 없지만, **알림과 함께 재생되는 분위기 있는 음악**으로 공포·고립감을 강화했다고 리뷰에서 언급합니다.[8]

6. **자유 텍스트 입력 여부**  
   - 사용자는 **미리 정의된 선택지만 고를 수 있고 자유 입력은 지원하지 않는** 전형적인 분기형 구조입니다.[11][10]

***

## Reigns / Reigns: Her Majesty

1. **텍스트 표시 방식**  
   - 중앙에 하나의 **“이벤트 카드”**가 크게 나오고, 카드 위·아래에 짧은 텍스트(상황 설명 + 질문)가 들어가는 카드 기반 레이아웃입니다.[12][13]

2. **선택지 UI**  
   - 플레이어는 카드를 **왼쪽/오른쪽으로 스와이프**해서 “예/아니오” 스타일의 양자택일을 하며, 각 방향에 대한 함축적인 텍스트/아이콘이 카드 가장자리에 표시됩니다.[4][13][12]

3. **캐릭터 표현**  
   - 왕과 조언자, 백성 등은 **단순한 아이콘화된 캐릭터 일러스트**로 카드나 이벤트 화면에 나타나며, 텍스트와 함께 캐릭터의 유형만 전달하는 수준의 미니멀한 표현입니다.[13]

4. **진행 피드백(스탯/지도 등)**  
   - 화면 상단에 교회, 국민, 군대, 재정을 나타내는 **네 개의 아이콘(막대/게이지)**가 항상 표시되며, 선택에 따라 각각이 오르내립니다.[14][4]
   - 어떤 수치가 0 또는 100에 도달하면 즉시 게임오버이므로, **스탯 막대가 핵심 피드백 / 경고 UI**입니다.[4][14]

5. **배경/분위기(색/일러/사운드)**  
   - 플랫 컬러와 기하학적인 아이콘, 간결한 애니메이션을 사용하는 **극단적 미니멀리즘** 비주얼에, 중세·다크 코미디 톤의 음악이 더해져 가벼운 듯 무거운 분위기를 만듭니다.[12][13]

6. **자유 텍스트 입력 여부**  
   - 입력은 모두 **스와이프에 대응하는 이산 선택**뿐이며, 텍스트를 직접 입력하는 기능은 없습니다.[13][12]

***

## 80 Days (inkle)

1. **텍스트 표시 방식**  
   - 각 도시·여정 중에는 **인터랙티브 내러티브 텍스트 블록 + 그 아래 선택지** 구조로 이야기가 진행되며, 수천 개의 분기 텍스트가 준비되어 있습니다.[5][15]
   - 내러티브는 시퀀스 형태로 이어지고, 여행 경로 선택·대화 선택 등에서 짧은 문단 단위의 텍스트가 교체되는 방식입니다.[16][5]

2. **선택지 UI**  
   - 도시 이벤트에서는 몇 개의 문장형 선택지를 버튼처럼 탭하여 다음 문단/상황으로 이동하며, **여행 경로 선택은 3D 지구본 위의 노선 아이콘을 탭**하는 방식과 결합됩니다.[17][5]

3. **캐릭터 표현**  
   - Passepartout와 NPC들은 주로 텍스트로 표현되며, 배경 일러스트와 도시 아트가 주요 시각 요소이고, 캐릭터 얼굴 스프라이트는 제한적으로 사용됩니다.[15][18]

4. **진행 피드백(스탯/지도 등)**  
   - 3D 지구본에서 현재 위치와 이동 경로, 남은 시간(80일 제한), 도시 간 연결이 시각적으로 표시되어 **지도 자체가 진행도 UI**입니다.[5][17]
   - 머니, 건강, 평판 등 간단한 스탯이 존재하며, 선택 결과의 성공/실패와 경로 개방 여부에 영향을 주는 텍스트 기반 피드백으로 사용됩니다.[19][5]

5. **배경/분위기(색/일러/사운드)**  
   - 스팀펑크 변주를 입힌 19세기 세계 지도를 기반으로, 도시별 독특한 일러스트와 색 조합으로 분위기를 달리하며, 전체적으로 **“여행 잡지 + 소설” 같은 UI 미학**을 지향합니다.[18][20][15]

6. **자유 텍스트 입력 여부**  
   - 유저 입력은 모두 **사전 정의된 선택지와 경로 선택**에 한정되며, 자유 텍스트 입력은 없습니다.[16][5]

***

## Sorcery! (inkle)

1. **텍스트 표시 방식**  
   - 메인 읽기 인터페이스는 **짧은 텍스트 “조각(slips)”이 아래로 계속 이어져 “꿰매지는” 흐름형 스크롤**로, 종이 조각을 하나씩 붙여 나가는 듯한 UI입니다.[21]
   - 지도 상에서 위치를 이동하면 해당 지점의 텍스트 조각이 추가되어, 지도·텍스트가 긴밀히 연결됩니다.[17][21]

2. **선택지 UI**  
   - 대부분의 상황에서 텍스트 아래에 여러 선택 문장이 링크/버튼처럼 붙어 있고, 이를 탭하여 다음 조각으로 이동합니다.[21]
   - 전투·마법 시에는 별도의 인터페이스(주문 선택, 공격 강도 선택 등)가 나타나지만 여전히 텍스트 중심입니다.[19][21]

3. **캐릭터 표현**  
   - 주인공은 일러스트보다 **스탯과 “Spirit Guide”(동물 아이콘)**로 표현되며, 이 동물 아이콘은 플레이 스타일에 따라 변해 캐릭터 성향을 시각적으로 보여줍니다.[21]

4. **진행 피드백(스탯/지도 등)**  
   - 상단 고정 UI에 **체력(stamina), 재산(wealth), 식량(provisions)**이 항상 표시되고, 여기에 더해 용기·공감·고결함·무모함 등 여섯 가지 성향 수치가 플레이 스타일을 추적합니다.[19][21]
   - 크게 그려진 종이 지도 위에서 실제로 경로를 따라 아이콘이 이동하므로, **지도 자체가 스토리의 브레드크럼과 진행도**입니다.[17][21]

5. **배경/분위기(색/일러/사운드)**  
   - 네팔·티벳·인도네시아 직물 사진, 천, 그림자 등을 활용한 **“재질감 있는 책/지도” UI**로, 텍스트는 캔버스와 실로 묶여 있는 듯한 비주얼을 가집니다.[21]

6. **자유 텍스트 입력 여부**  
   - 선택형 인터랙션에 기반하며, 유저가 자유 텍스트를 입력해 파서를 사용하는 방식은 아닙니다.[19][21]

***

## A Dark Room

1. **텍스트 표시 방식**  
   - 화면은 거의 전부 텍스트와 박스로 구성되며, **같은 서체·비슷한 크기의 텍스트가 상단에 로그, 하단에 액션·상태로 나뉘어 배치된 미니멀 UI**입니다.[22][19]
   - 이야기·상태 변화는 상단 텍스트가 위로 쌓여 가는 형태로 전달됩니다.[19]

2. **선택지 UI**  
   - “stoke fire”, “gather wood” 같은 **행동 버튼이 텍스트 링크/버튼**로 박스 안에 들어 있고, 이를 탭하면 상태가 변하고 새로운 텍스트가 추가됩니다.[22][19]

3. **캐릭터 표현**  
   - 플레이어 캐릭터는 그래픽적으로 표현되지 않고, **텍스트로만 “you”로 지칭되는 전형적인 텍스트 어드벤처 스타일**입니다.[23][19]

4. **진행 피드백(스탯/지도 등)**  
   - 자원 수량(나무, 식량 등)과 건물/업그레이드 상태가 화면의 여러 상자에 수치로 표시되어, **리소스 수치 변화가 곧 진행 피드백**입니다.[19]

5. **배경/분위기(색/일러/사운드)**  
   - 전체 화면이 검정·흰색·회색·파랑 4가지 색만 사용되며, 파랑은 주로 불을 지피는 버튼에만 사용되어 그 UI 요소에 시선을 집중시키는 역할을 합니다.[22]
   - 색과 공간이 절제돼 있어, 화면이 서서히 어두워지거나 상자가 늘어나는 것만으로도 긴장감과 확장감을 줍니다.[22][19]

6. **자유 텍스트 입력 여부**  
   - 모바일 버전 A Dark Room은 **클릭 가능한 텍스트 액션만 제공**하며, 플레이어가 임의 문장을 입력하는 파서 방식은 아닙니다.[19]

***

## Choices: Stories You Play

1. **텍스트 표시 방식**  
   - 개별 스토리는 **비주얼 노블 스타일**로, 하단 텍스트 박스에 대사·내레이션이 표시되고, 상단에는 장면과 캐릭터가 그려집니다.[2][24]
   - 앱은 여러 “책(book)”과 “챕터”를 라이브러리 UI에서 선택해 읽는 구조입니다.[24]

2. **선택지 UI**  
   - 특정 지점에서 **대화/행동 선택지가 텍스트 버튼**으로 2~3개 정도 나타나며, 프리미엄 선택지는 다이아몬드(유료 재화)를 요구하는 등 버튼 스타일이 차별화됩니다.[2][24]

3. **캐릭터 표현**  
   - 대부분의 스토리에서 플레이어 캐릭터는 머리, 얼굴, 헤어스타일, 의상을 커스터마이즈 가능한 **전신 일러스트 아바타**로 등장합니다.[25][26][2]
   - 상대 캐릭터들도 각기 다른 아트 스타일로 그려져, 로맨스/드라마 중심의 감정선을 시각적으로 강조합니다.[24]

4. **진행 피드백(스탯/지도 등)**  
   - 각 스토리는 책(book) → 챕터 구조로 나뉘고, **챕터 완료 시 다이아몬드 보상, 재생 횟수·챕터 길이 등의 메타 통계**를 보여 주는 새로운 챕터 인터페이스가 도입되었습니다.[27][24]

5. **배경/분위기(색/일러/사운드)**  
   - 로맨스·판타지·미스터리 등 장르별로 배경 일러스트·UI 색상이 달라지지만, 전반적으로 **밝고 TV 드라마 같은 연출**을 추구하는 비주얼입니다.[2][24]

6. **자유 텍스트 입력 여부**  
   - 플레이어 입력은 **미리 준비된 대사/행동 선택지와 외형 커스터마이즈**에 한정되며, 자유 텍스트 입력 기능은 없습니다.[2]

***

## Episode

1. **텍스트 표시 방식**  
   - Episode 역시 **시각 소설/코믹 스타일**로, 만화처럼 연출된 장면 위에 말풍선 또는 하단 텍스트 박스로 대사를 표시하는 형식입니다.[6][28]

2. **선택지 UI**  
   - 중요한 순간마다 **행동·대화 선택지가 메뉴 버튼 형태**로 나타나고, 일부 “프리미엄 선택”은 인게임 화폐로 잠금 해제해야 합니다.[29][6]

3. **캐릭터 표현**  
   - 플레이어 아바타는 머리, 메이크업, 얼굴 특징, 의상을 세밀하게 커스터마이즈할 수 있는 **애니메이션 캐릭터**로 표현됩니다.[28][30][6]
   - 상대 캐릭터들도 만화풍 애니메이션으로 움직이며, 카메라 앵글과 연출로 “애니메이션 드라마”에 가까운 느낌을 줍니다.[28]

4. **진행 피드백(스탯/지도 등)**  
   - **에피소드/챕터 구조**로 스토리가 진행되며, 하루에 읽을 수 있는 무료 챕터 수, 스토리 팩 등 메타 진행을 “키/패스” 시스템으로 관리합니다.[6][28]

5. **배경/분위기(색/일러/사운드)**  
   - 다양한 장르를 다루지만 공통적으로 **밝고 포화도 높은 색감, 코믹 패널 같은 구도**를 사용해 TV 시리즈와 유사한 톤을 유지합니다.[29][28]

6. **자유 텍스트 입력 여부**  
   - 유저는 준비된 선택지를 고를 뿐이며, **기본 플레이에서 자유 텍스트 입력은 하지 않습니다**(스토리 제작 툴은 별도).[6][28]

***

## Magium

1. **텍스트 표시 방식**  
   - Magium은 긴 문단의 텍스트를 읽어 내려가는 **인터랙티브 소설 형식**으로, 화면에 스크롤 가능한 텍스트와 하단 선택지가 배치됩니다.[31][32]

2. **선택지 UI**  
   - 스토리 분기 선택은 Choice of Games 스타일과 비슷하게 **여러 개의 텍스트 선택지 버튼**을 탭하는 방식입니다.[32]

3. **캐릭터 표현**  
   - 주인공 Barry와 조연들은 거의 전적으로 텍스트로만 묘사되며, 모바일 버전은 **텍스트 중심 UI로 그래픽 캐릭터 표현이 거의 없는** 것으로 평가됩니다.[33][31]

4. **진행 피드백(스탯/지도 등)**  
   - 특이하게, 행동을 통해 스탯이 오르는 것이 아니라 **플레이어가 어떤 스탯을 올릴지 직접 선택하는 시스템**이 있고, 이 수치들(힘, 속도, 관찰력 등)이 이후 선택의 성공 여부를 결정합니다.[34][31]

5. **배경/분위기(색/일러/사운드)**  
   - 인터페이스는 “팬터지 소설을 읽는 느낌”에 가까운 단순 UI이며, 일부 유저는 어두운 테마, 폰트 크기 등 UI 개선을 요청할 정도로 **텍스트 읽기 중심, 미니멀 비주얼**입니다.[35][33]

6. **자유 텍스트 입력 여부**  
   - 전형적인 CYOA 방식으로, **유저 자유 입력은 없고** 미리 정의된 선택지만 존재합니다.[31][32]

***

## Florence

(엄밀히 말하면 선택지형 텍스트 게임보다는 **“터치 기반 인터랙티브 그래픽 노블”**에 가깝지만, 스토리텔링 UI 측면에서 참고 가치가 큼)

1. **텍스트 표시 방식**  
   - 대사는 거의 텍스트 대신 **말풍선 안의 퍼즐 조각/도형**으로 표현되며, 플레이어가 조각을 맞추면서 대화가 진행되는 방식이라 문자 자체가 최소화되어 있습니다.[36][37][38]
   - 챕터 간에는 디지털 시계 등 짧은 시각적 인서트로 시간 경과를 보여 주며, 별도의 대사 텍스트 없이도 내러티브를 전달합니다.[39][40]

2. **선택지 UI**  
   - 전통적인 “텍스트 선택지 버튼”은 거의 없고, 대신 **퍼즐(조각 맞추기), 드래그, 탭 등의 미니 게임형 인터랙션**으로 감정과 선택을 표현합니다.[37][36][39]

3. **캐릭터 표현**  
   - Florence와 Krish는 **스케치 만화 스타일의 연속 컷**으로 표현되며, 표정·포즈·색감 변화가 감정선 전달의 핵심입니다.[37][39]

4. **진행 피드백(스탯/지도 등)**  
   - 수치 스탯이나 지도는 없고, 챕터 구성과 컷씬의 시간 흐름(어릴 때→성인기→연애→이별)이 곧 진행 상태를 나타냅니다.[38][40]

5. **배경/분위기(색/일러/사운드)**  
   - 파스텔톤 색감, 잔잔한 BGM, 일상적인 소리 효과를 통해 **아주 섬세한 감정선**을 전달하며, 사운드를 켜고 플레이할 것을 강하게 권장합니다.[39][37]

6. **자유 텍스트 입력 여부**  
   - 자유 텍스트 입력은 없고, **제스처와 퍼즐만으로 스토리를 따라가는 구조**입니다.[40][37]

***

## AI Dungeon

1. **텍스트 표시 방식**  
   - 중심은 **긴 로그 형식 텍스트 창**으로, AI가 생성한 내러티브가 콘솔/채팅 로그처럼 누적됩니다.[3][41]
   - 다양한 “테마”를 적용해 글꼴·색·배경을 크게 바꿀 수 있는 테마 시스템이 있어, 같은 레이아웃 안에서도 분위기를 완전히 바꿀 수 있습니다.[42]

2. **선택지 UI**  
   - 기본 플레이는 **완전 자유 텍스트 입력**이지만, “Take a Turn” UI에 **Do / Say / Story 버튼**이 있어 입력 모드를 전환할 수 있고, 일부 클라이언트에서는 액션 버튼이 행 형태로 배치됩니다.[43][44][3]

3. **캐릭터 표현**  
   - 캐릭터는 거의 모두 텍스트로만 존재하며, 일부 테마에서 배경 일러스트나 아이콘을 쓸 수 있지만 **기본 경험은 순수 텍스트 로그**입니다.[41][3]

4. **진행 피드백(스탯/지도 등)**  
   - 전통적인 스탯·지도 UI는 없지만, **Undo/Redo/Retry/Edit, Plot Components, Story Cards** 등 메타 도구가 사이드 UI로 제공되어 스토리의 일관성과 진행 유지를 돕습니다.[3]

5. **배경/분위기(색/일러/사운드)**  
   - 텍스트 테마에 따라 폰트·색·배경이 크게 바뀌며, 장르(판타지, 공포 등)에 맞는 시각 스킨을 선택할 수 있도록 설계되고 있습니다.[42]

6. **자유 텍스트 입력 여부**  
   - 이 목록 중 **유일하게 완전 자유 입력을 전제로 한 게임**으로, 플레이어가 원하는 어떤 문장이든 입력 가능하며, 이는 Do/Say/Story 모드에 따라 행동·대사·서술로 해석됩니다.[41][43][3]

***

## 공통 패턴

1. **텍스트 중심 스크린 + 하단/주변 선택지**  
   - Lifeline(채팅), 80 Days, Sorcery!, Magium, Choices, Episode 등 대부분은 **중앙/상단에 내러티브 텍스트, 그 주변에 선택지 버튼**이라는 공통 구조를 사용합니다.[1][32][5][6][2][21]
   - 이는 “읽기 → 짧은 결정 → 다시 읽기”라는 루프를 직관적으로 지지하는 UI 패턴입니다.  

2. **2~4개 사이의 제한된 선택 수**  
   - Lifeline은 항상 2지선다, Reigns는 좌/우 2지선다, Choices·Episode·Magium은 대부분 2~3개의 옵션을 제공합니다.[10][32][12][2]
   - 선택 수를 적게 유지함으로써 모바일 환경에서 **결정 피로를 줄이고 리듬감을 유지**합니다.  

3. **진행 피드백으로서의 지도·스탯·챕터 구조**  
   - Reigns의 네 개 아이콘, Sorcery!와 80 Days의 지도, Magium·A Dark Room의 스탯, Choices/Episode의 책·챕터 구조 등은 서로 방식은 다르지만 **“현재 어디쯤인가”를 보여주는 간단한 메타 UI**라는 공통 역할을 합니다.[14][27][5][24][21][19]

4. **미니멀 텍스트 기반 vs 비주얼 노블 기반으로 양극화**  
   - Lifeline, A Dark Room, Magium, AI Dungeon은 거의 순수 텍스트·단색 UI를 쓰는 반면, Choices, Episode, Florence는 **풍부한 일러스트와 애니메이션**을 사용해 감정선을 비주얼로 보강합니다.[33][3][8][37][6][2][22]

5. **실시간성/시간 연출의 적극 활용**  
   - Lifeline의 실시간 대기, 80 Days의 끊임없이 흐르는 시간, A Dark Room의 점진적 해금, Florence의 시계 인서트 등은 **시간 감각을 UI 레벨에서 설계**한 예입니다.[40][5][10][19]

***

## 주요 차이점과 UX 포지셔닝

| 게임 | 텍스트 표시 방식 | 선택 인터랙션 | 캐릭터 표현 | 진행 피드백 핵심 | 자유 텍스트 입력 |
|------|------------------|---------------|-------------|------------------|------------------|
| Lifeline | 채팅/SMS 스트림[7][8] | 2지선다 버튼[10] | 텍스트만[8] | 실시간 지연·메시지[10] | 없음[10] |
| Reigns | 카드 1장 + 짧은 텍스트[12] | 좌/우 스와이프[13] | 단순 아이콘[13] | 4 스탯 아이콘[14] | 없음[12] |
| 80 Days | 텍스트 패널 + 3D 지구본[5][17] | 버튼 선택 + 지도 노선 탭[5] | 최소 일러스트[15] | 시간·돈·지도[19][5] | 없음[5] |
| Sorcery! | 스크롤 “슬립” 흐름[21] | 텍스트 선택지 버튼[21] | Spirit Guide 아이콘[21] | 스탯·지도 동시 노출[21] | 없음[21] |
| A Dark Room | 텍스트 로그 + 박스[22][19] | 텍스트 액션 버튼[22] | 없음(텍스트만)[19] | 자원 수치·건물 상태[19] | 없음[19] |
| Choices | 비주얼 노블 대화창[2][24] | 대사 버튼(+프리미엄)[2] | 커스터마이즈 아바타[25][26] | 책/챕터·통계[24][27] | 없음[2] |
| Episode | 만화/애니메이션 말풍선[28][6] | 대사·행동 메뉴[6] | 고도로 커스터마이즈된 캐릭터[28][30] | 에피소드/챕터·키 시스템[6] | 없음[6] |
| Magium | 소설식 스크롤 텍스트[31][32] | 텍스트 선택지 버튼[32] | 텍스트만[33] | 능력치 선택·체크[31][34] | 없음[32] |
| Florence | 코믹 패널·이미지 중심[37][39] | 퍼즐/제스처[37][36] | 만화체 캐릭터[37] | 챕터 구조·시계 연출[40] | 없음[37] |
| AI Dungeon | 콘솔형 텍스트 로그[3][41] | 자유 입력 + 모드 버튼[3][43] | 텍스트만[3] | 메타 도구(Undo·Story Cards)[3] | 있음 (핵심)[3][43] |

### UX 관점에서 볼 때의 시사점

- **“텍스트 선택지 코치형”을 만들고 싶다면**: Lifeline처럼 채팅 UI + 2지선다 + 실시간 알림 구조가, 사용자의 “상담/코칭 관계” 감정을 잘 자극합니다.[7][10]
- **“가벼운 반복 플레이”를 원하면**: Reigns 카드 스와이프 + 4스탯 막대처럼, **한 화면·한 제스처·한 스탯 패널**로 압축하는 것이 효과적입니다.[4][14]
- **“여행/경로 탐색”을 강조하려면**: 80 Days·Sorcery!처럼 **지도(또는 개념 지도)를 메인 화면으로 두고 텍스트는 패널로 보조**하는 레이아웃이 강력합니다.[5][17][21]
- **“감정 서사”에 집중한다면**: Florence·Choices·Episode처럼 텍스트보다 **표정·색·사운드**를 UI 1급 시민으로 취급하는 설계를 고려할 수 있습니다.[28][37][39][2]
- **“최대 자유도”를 제공하고자 한다면**: AI Dungeon처럼 텍스트 입력 + 모드 전환(Do/Say/Story)을 쓰되, **Undo/편집 도구와 테마 설정**으로 사용자의 부담을 줄이는 것이 중요합니다.[43][3][42]

이 정도 틀을 기반으로, 만드려는 앱이 “상담/코칭형 vs 모험/경로 탐색형 vs 시각 소설형 vs 자유 상상형” 중 어디에 가까운지 먼저 잡고, 그에 맞는 텍스트 표시·선택·피드백 패턴을 조합하면 좋겠습니다.

출처
[1] Lifeline – A Game in Review https://danny.blog/2015/07/10/lifeline-a-game-in-review/
[2] Choices: Stories You Play https://en.wikipedia.org/wiki/Choices:_Stories_You_Play
[3] What are the basics of AI Dungeon? https://help.aidungeon.com/faq/the-basics
[4] Dynasty's Choice - Apps on Google Play https://play.google.com/store/apps/details?id=com.hoangdev.reigns_clone
[5] 80 Days Gameplay PC - Circumnavigate The Globe In 80 Days - 80 Days Steam Version https://www.youtube.com/watch?v=sBOt_XZfWbY
[6] Episode (video game) - Wikipedia https://en.wikipedia.org/wiki/Episode_(video_game)
[7] I've been texting with an astronaut https://boingboing.net/2015/05/07/lifeline-astronaut-game.html
[8] Lifeline (3 Minute Games) https://emshort.blog/2015/05/23/lifeline-3-minute-games/
[9] Lifeline... on the App Store - Apple https://apps.apple.com/se/app/lifeline/id982354972?l=en-GB
[10] “Lifeline” creates immersive story in space https://www.themuseatdreyfoos.com/entertainment/2016/01/22/lifeline-creates-immersive-story-in-space/
[11] Lifeline Brings Mystery And Intrigue To iOS Users https://justgoodbites.com/review-lifeline/
[12] Reigns Gameplay - Swipe Your Royal Finger Left or Right - Reigns on PC, IOS & Android https://www.youtube.com/watch?v=j20XeVvY9ao
[13] The Casual (but Regal) Swipe: Creating Game Mechanics in ... https://www.youtube.com/watch?v=tDdtbh-oUTU
[14] What do the top symbols stand for : r/ReignsGame https://www.reddit.com/r/ReignsGame/comments/zx9bg8/what_do_the_top_symbols_stand_for/
[15] 80 Days - NextRoom.io https://nextroom.io/reviews/80-days/
[16] 80 Days: An Adventure Around the World https://mechanicsofmagic.com/2023/04/22/80-days-an-adventure-around-the-world/
[17] 2014: 80 Days - by Aaron A. Reed - 50 Years of Text Games https://if50.substack.com/p/2014-80-days
[18] The Makers of Mobile Hit '80 Days' on the Importance ... https://www.vice.com/en/article/the-makers-of-mobile-hit-80-days-on-the-importance-of-amazing-ui-852/
[19] Simple messaging UI for mobile game https://lemmasoft.renai.us/forums/viewtopic.php?t=63458
[20] So what is 80 Days? https://www.inklestudios.com/2014/04/15/so-what-is-eighty-days.html
[21] How to create a card-swipe system like Tinder or Reigns? https://www.reddit.com/r/Unity3D/comments/6713zt/how_to_create_a_cardswipe_system_like_tinder_or/
[22] Visual Design Of Games: A Dark Room https://mechanicsofmagic.com/2022/04/18/5918/
[23] A Dark Room's unique journey from the web to iOS https://www.gamedeveloper.com/design/-i-a-dark-room-i-s-unique-journey-from-the-web-to-ios
[24] Choices: Stories You Play (Visual Novel) https://tvtropes.org/pmwiki/pmwiki.php/VisualNovel/ChoicesStoriesYouPlay
[25] Choices: Stories You Play 앱 - App Store https://apps.apple.com/kr/app/choices-stories-you-play/id1071310449
[26] Choices: Stories You Play – Apps on Google Play https://play.google.com/store/apps/details?id=com.pixelberrystudios.choices&hl=en_AU
[27] Heads up, Choices has a new chapter interface where you ... https://www.reddit.com/r/Choices/comments/gohjo3/heads_up_choices_has_a_new_chapter_interface/
[28] Episode Game - Complete Interactive Story Game Guide & Wiki 2025 https://www.playepisodegame.com
[29] Episode - Choose Your Story – Apps on Google Play https://play.google.com/store/apps/details/Episode_Choose_Your_Story?id=com.episodeinteractive.android.catalog&hl=en_IN
[30] Episode - Choose Your Story - Apps on Google Play https://play.google.com/store/apps/details?id=com.episodeinteractive.android.catalog
[31] Magium for Android - Download the APK from Freedown https://magium.freedown.io/android
[32] Magium - WIP - Interactive novel - Choice of Games Forum https://forum.choiceofgames.com/t/magium-wip-interactive-novel/11383
[33] 10 Best Text Games on Android https://nerdschalk.com/best-text-android-games/
[34] Magium - The mage tournament (WIP) -> Updated 09/12 ... https://forum.choiceofgames.com/t/magium-the-mage-tournament-wip-updated-09-12-2015/11684
[35] [IMPORTANT] Readers, the game needs your help. https://www.reddit.com/r/Magium/comments/o8xcww/important_readers_the_game_needs_your_help/
[36] A look at Florence's conversation mechanic : r/gamedev https://www.reddit.com/r/gamedev/comments/gl43du/a_look_at_florences_conversation_mechanic/
[37] 'Florence' Is a Mobile Game That Captures the Power of ... https://www.wired.com/story/florence-touch-mobile-game/
[38] Designing Florence to convey the ineffable feeling of being ... https://www.gamedeveloper.com/audio/designing-i-florence-i-to-convey-the-ineffable-feeling-of-being-in-love
[39] 'Florence' and Brilliant Visual Storytelling https://epiloguegaming.com/florence-and-brilliant-visual-storytelling/
[40] Deconstructing Act 1 of Florence - Robin Kwong https://www.robinkwong.com/florence-act-one/
[41] AI Dungeon: RPG & Story Maker https://play.google.com/store/apps/details?id=com.aidungeon&hl=en_GB
[42] Sneak Peak at Text/Display Options Coming to Phoenix : r ... https://www.reddit.com/r/AIDungeon/comments/17gch5m/sneak_peak_at_textdisplay_options_coming_to/
[43] The Do Mode https://help.aidungeon.com/the-do-mode
[44] [Positive Feedback] The model switcher version of ... https://www.reddit.com/r/AIDungeon/comments/1lfr9eo/positive_feedback_the_model_switcher_version_of/
[45] Sorcery screenshots! https://www.inklestudios.com/2013/03/12/sorcery-screenshots.html
[46] What are some ways to make dialogue choices engaging ... https://www.reddit.com/r/gamedesign/comments/163uaxu/what_are_some_ways_to_make_dialogue_choices/
[47] Pocket Gems Launches Episode, A Platform For Interactive ... https://techcrunch.com/2014/02/20/pocket-gems-launches-episode/
[48] Looking for example of "Card Swipe" mechanic like Reigns https://forum.gdevelop.io/t/looking-for-example-of-card-swipe-mechanic-like-reigns/49411
[49] 80 Days (2014 video game) https://en.wikipedia.org/wiki/80_Days_(2014_video_game)
[50] Support keyboard navigation to select choice · Issue #865 https://github.com/inkle/ink/issues/865
[51] 2 Amazing Mechanics in Florence https://www.youtube.com/watch?v=K7G8aScWVr8
[52] Digital keyboard covers UI and buttons : r/AIDungeon https://www.reddit.com/r/AIDungeon/comments/1o9u9ov/digital_keyboard_covers_ui_and_buttons/
[53] Would you buy this game again? - II - Discussion https://forums.ageofempires.com/t/would-you-buy-this-game-again/284258
[54] Clock & Timer https://www.gameuidatabase.com/index.php?scrn=137
[55] HOW TO MAKE REIGNS IN UNITY - ADVANCED UI ... https://www.youtube.com/watch?v=-THwbRWyRhs
[56] What genre are Reigns games on ios? https://www.facebook.com/groups/132728896890594/posts/3222090444621075/
[57] SWIPE RIGHT! SWIPE LEFT! SWIPE... EVERYTHING ... https://www.youtube.com/watch?v=5SDI4zE97Mw
[58] Nothmere game gui update with new screenshots https://www.facebook.com/groups/adventuregamespointandclick/posts/10162686661520369/
[59] Sorcery! - inkle https://www.inklestudios.com/sorcery/
[60] GameDev Platform https://t.me/s/gamedevplatform?before=270
[61] Episode - Choose Your Story – Apps on Google Play https://play.google.com/store/apps/details/Episode_Choose_Your_Story?id=com.episodeinteractive.android.catalog&hl=en_ZA
[62] Steve Jackson's Sorcery https://handheldgamingcommunity.com/steve-jacksons-sorcery/
[63] Text-Based Game Design (Principles, Examples, Mechanics) https://gamedesignskills.com/game-design/text-based/
[64] Lifeline: Beside You in Time 앱 - App Store https://apps.apple.com/us/app/lifeline-beside-you-in-time/id1608851471?l=ko
[65] Tag: free apple watch games https://wp.testreveal.com/tag/free-apple-watch-games/
[66] Building a narrative out of push notifications in Lifeline https://www.gamedeveloper.com/design/building-a-narrative-out-of-push-notifications-in-i-lifeline-i-
[67] Top 11 Exciting Games for Your Apple Watch https://www.lemon8-app.com/@allisonb22_/7425318749491806726?region=us
[68] Lifeline: an interview – Verba mutant https://www.quintadicopertina.com/fabriziovenerandi/?p=493
[69] Ứng dụng Lifeline: Beside You in Time - App Store https://apps.apple.com/us/app/lifeline-beside-you-in-time/id1608851471?l=vi&platform=ipad
[70] Lifeline — Game? Narrative? Or Future? https://interactivemediaarchive.wordpress.com/lifeline-game-narrative-or-future/
[71] Zipline Inc. - App Store - Apple https://apps.apple.com/es/app/zipline-inc/id1221555019?l=en-GB
[72] Just finished Lifeline for IOS, anyone else?, Reactions? https://www.reddit.com/r/iosgaming/comments/34wp9i/just_finished_lifeline_for_ios_anyone_else/
