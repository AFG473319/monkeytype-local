/* =====================================================================
   Word lists and language sets.
   The English list is built from common-English frequency data (the
   well-known thousand-word core list). Code "languages" are collections
   of language keywords and symbols, the same idea monkeytype uses.
   ===================================================================== */

(function () {
  const MT = (window.MT = window.MT || {});

  const english = `
the of and to a in is it you that he was for on are with as i his they be at one have this from
or had by hot word but what some we can out other were all there when up use your how said an each
she which do their time if will way about many then them write would like so these her long make
thing see him two has look more day could go come did number sound no most people my over know
water than call first who may down side been now find any new work part take get place made live
where after back little only round man year came show every good me give our under name very
through just form much great think say help low line before turn cause same mean differ move right
boy old too does tell sentence set three want air well also play small end put home read hand port
large spell add even land here must big high such follow act why ask men change went light kind
off need house picture try us again animal point mother world near build self earth father head
stand own page should country found answer school grow study still learn plant cover food sun four
between state keep eye never last let thought city tree cross farm hard start might story saw far
sea draw left late run dont while press close night real life few stop open seem together next
white children begin got walk example ease paper often always music those both mark book letter
until mile river car feet care second group carry took rain eat room friend began idea fish
mountain north once base hear horse cut sure watch color face wood main enough plain girl usual
young ready above ever red list though feel talk bird soon body dog family direct pose leave song
measure door product black short numeral class wind question happen complete ship area half rock
order fire south problem piece told knew pass since top whole king space heard best hour better
true during hundred five remember step early hold west ground interest reach fast verb sing listen
six table travel less morning ten simple several vowel toward war lay against pattern slow center
love person money serve appear road map science rule govern pull cold notice voice fall power town
fine certain fly unit lead cry dark machine note wait plan figure star box noun field rest correct
able pound done beauty drive stood contain front teach week final gave green oh quick develop sleep
warm free minute strong special mind behind clear tail produce fact street inch lot nothing course
stay wheel full force blue object decide surface deep moon island foot yet busy test record boat
common gold possible plane age dry wonder laugh thousand ago ran check game shape yes hot miss
brought heat snow bed bring sit perhaps fill east weight language among

computer internet screen keyboard practice speed accuracy mouse phone email video music machine
program system data network server window button folder file click type letter memory message
coffee morning evening summer winter garden window station camera picture travel flight hotel
office meeting project design client market price value answer science history chapter forest
sentence language rhythm pattern balance curious gentle silver golden steady bright simple quiet
clever honest patient courage freedom journey moment number object option period person planet
reason result rhythm season signal source spirit target theory tissue travel useful visual volume
wealth weather wonder
`;

  /* A second tier of English: everyday words a notch less frequent than the
     core list above, so long tests do not keep recycling the same 600 words.
     Anything already in the core list is dropped by toWords(). */
  const englishExtra = `
ability accident account action active actual adapt address admit adult advantage adventure advertise
advice afford afraid agency agenda agreement ahead aid alarm alert alien alive allow alter alternative
amount ancient anger angle angry ankle announce annual anxious apart apparent appeal appetite apply
appoint appreciate approach approve argue arise arrange arrest arrive arrow artist ashamed aside asleep
aspect assist assume attach attempt attend attract audience author available average avoid awake aware
awful awkward badge balance balloon band bare bargain barrier basin basis battle beach beam bean bear
beard beast beg behave belief belong belt bench bend benefit betray beyond bind bitter blame blanket
bleed blend bless blind block bloom blow board boast bold bolt bone bonus boost border bore borrow boss
bother bottom bounce bound bowl brain branch brave bread breathe breed brick brief brilliant broad
broken bronze brush bubble bucket bud budget build bunch bundle burden burn burst bury bush busy butter
button buyer cabin cable calculate calm camera camp cancel candidate capable capture carbon career
cargo carpet carve case cash cast castle casual cattle caution cease ceiling cell cement central
century chain challenge chamber champion chance channel chapter charge charm chase cheap cheat cheek
cheer chest chew chief child chill chin chip choice choose chop circuit cite citizen civil claim claw
clay clean clerk clever client cliff climate climb clinic clip clock cloth cloud club clue cluster
coach coal coast coat code coffee coin collapse collar collect college colony column combat combine
comfort command comment commerce community compare compete complain complex concern concert conclude
concrete condition conduct confess confirm conflict confuse congress connect conscious consent
consider consist constant contact contain contest context continue contract contrast control
convenient convince cook cool cope copy core corner cost cottage cotton cough count counter country
county couple courage court cousin cover crack craft crash crazy cream create creature credit creep
crew crime crisis critical crop cross crowd crown crucial cruel crush cry crystal culture cure curious
current curve custom cycle damage damp dance danger dare dash data date dawn deal debate debt decade
decent decide declare decline decorate decrease deep defeat defend define degree delay deliver demand
deny depart depend deposit depth derive describe desert deserve design desire desk desperate destroy
detail detect develop device devote diamond diary diet differ dig digital direct dirt disagree
disappear disappoint disaster discipline discount discover disease disgust dish dismiss display
distance district disturb ditch dive divide divorce dizzy dock doctor document dodge dollar domestic
dominant donate door dose double doubt dozen draft drag drain drama draw dread dream dress drift drill
drink drive drop drown drug drum drunk dry duck due dull dump duration dust duty dwell eager eagle earn
ease echo edge edit educate effect effort elbow elder elect electric elegant element elephant elevator
emerge emergency emotion employ empty enable enclose encounter encourage endure enemy energy engage
engine enhance enjoy enormous ensure enter entertain entire entrance envelope envy equal equipment era
erase error escape especially essay essential establish estate estimate eternal evaluate even event
eventually evidence exact examine exceed except exchange excite exclude excuse execute exercise
exhaust exhibit exist exit expand expect expense expert expire explain explode explore export expose
express extend extent extra extreme fabric face facility factor fade fail faint fair faith false fame
familiar fancy fantasy fashion fasten fate fault favor fear feature federal feeble feed feel fellow
female fence ferry fetch fever fiber fiction fierce figure file fill film filter final finance find
fine finger finish firm fish fit fix flash flat flavor flee flesh flexible flip float floor flour flow
flower fluid flush focus fold folk follow fond fool forbid force forecast foreign forest forever
forgive fork form formal former formula fort fortune forward foster found fountain fraction fragile
frame fraud free freeze frequent fresh friendly fright front frost frown frozen fruit fuel full fun
function fund funeral fur furnish further fury future gain gallery gamble garage garbage garden garlic
gas gasp gate gather gauge gaze gear gender gene general generate generous genius gentle genuine
gesture ghost giant gift giggle glad glance glass gleam glide glimpse glitter global glory glove glow
glue goal goddess golf gossip govern gown grab grace grade gradual grain grand grant grape graph grasp
grass grave grease greed greet grief grill grim grin grind grip groan grocery groom grove growl grunt
guard guess guest guide guilt guitar gulf gun habit hail hair hall halt hammer handle hang harbor
harm harsh harvest haste hatch hate haul haunt hawk hay hazard haze heal health heap heart heat heaven
heavy hedge heel height heir hello helmet herd hero hesitate hidden hill hint hire history hobby hold
hole holiday hollow holy honest honey honor hook hope horizon horn horror host hotel hound hover howl
hug huge humor hunger hunt hurdle hurry hurt husband hybrid hymn ideal identify idle ignite ignore
illness illusion image imitate impact import impose impress improve impulse inch include income
increase indeed index indicate individual industry infant inform initial inject injure inner innocent
input inquire insect insert inside insight insist inspect inspire install instance instant instead
insult insure intact intend intense interest interfere interior internet interrupt interval interview
introduce invade invent invest investigate invite involve iron isolate issue item ivory jacket jail
jam jar jaw jealous jelly jewel job join joint joke journal journey joy judge juice jump jungle junior
junk jury keen kettle kick kidnap kidney kill kilo kingdom kiss kitchen kite kitten kneel knife knight
knit knob knock knot label labor ladder lady lake lamb lamp land lane lap large laser latch late launch
laundry law lawn layer lazy lead leaf league leak lean leap learn lease leash least leather leave
lecture ledge left legal legend leisure lemon lend length lens leopard less lesson level liberty
library license lick lid lie lift light limb lime limit limp link lion lip liquid list listen literal
live lizard load loaf loan lobby local lock lodge log logic lonely loop loose lord lose loss loud low
loyal luck luggage lumber lump lunar lunch lung luxury
`;

  const englishExtra2 = `
machine magic magnet maid mail major mammal manner mansion manual marble margin marine marriage marsh
mask mass master match material matter mature meadow meal meat medal medium melon menu mercy merit
metal meter method middle midnight milk mill mind mine mineral mirror mission mist mixture mobile mode
model modern modest mood moral morale moss motel motor mould mount mouse mouth mud mule murder muscle
museum mushroom mystery nail naked napkin narrow nasty nation native natural nature navy neat needle
negative nerve nest net neutral noble node noodle noon normal nose note novel nurse nut oath obey
object observe obtain obvious occupy occur odd odour offer official offset oily olive onion opera
operate opinion oppose option orange orbit orchard order ordinary organ organize orphan ought oven owl
owner oxygen oyster pace pack pad paint pair palace pale palm panel panic pants parade parent park
parrot part passage passion passport past paste path patient patrol pattern paw payment peace peach
peak peanut pear peasant pebble pencil pension pepper perfume perhaps period permit persist person pet
petrol phrase physical piano pick picnic picture pie pig pigeon pile pill pillow pilot pin pine pink
pipe pistol pitch planet plastic plate platform platinum plea plot plug plum pocket poem poet point
poison pole police polish pond pony pool poor pork portion portrait position positive possible post
pot potato pound powder power practical praise prayer precise predict prefer prepare present preserve
preside press pressure pretend prevent previous price pride primary prime prince principle print prior
prison private prize probable problem proceed process produce profit program progress project promise
proof proper property propose prospect protect protest proud prove provide province publish pull pulse
pump punch punish pupil puppet purchase pure purple purpose purse puzzle pyramid quality quantity
queen question queue quick quiet quilt quit quote rabbit race rack radar radio raft rail railway
rainbow raise rake ramp ranch range rank rapid rare rat rate ratio raw ray reach react read ready real
realm reason receive recent recipe recognize recommend record recover reduce refer reflect reform
refuse regard region register regret regular reject relate relax release relevant reliable relief
religion rely remain remark remedy remember remind remove rent repair repeat replace reply report
represent republic request require rescue research resemble reserve resist resource respect respond
rest result resume retain retire retreat return reveal review reward ribbon rice ridge rifle ring riot
risk ritual rival roast robe robin robot rock rocket rod role roof root rope rose rot rough round
route royal rubber rubbish rude rug ruin rule rumour rural rush rust sack sail sailor saint salad
salmon salon salt salty sample sand sandwich satellite sauce sausage scale scar scene scent scheme
scholar scissors scooter score scrap screw script seal search seat sector seed seek segment seize
select seller senate sensible sensitive sentence separate serious servant session settle severe shade
shadow shaft shame shape share sharp shave shed sheet shelf shell shelter shield shift shine ship shirt
shock shoe shop shore shot shoulder shout shower shrimp shrine shrink side sight sign signal silence
silk silly silver similar simple since sincere singer single sink site sketch skill skin skirt sky
slave sleeve slide slight slim slope slot slow smell smile smoke smooth snack snake sneaker soft soil
solar soldier sole solid solve son sorrow soul soup sour source space spade spare spark speaker spear
special species specific speech speed spell spend spider spike spine spiral spirit spit split sponge
spoon sport spot spray spread spring spy square stable staff stage stair stake stamp stand stare star
start state statue status stay steady steam steel stem step stick stiff still stitch stock stomach
stone stool storm stove straight strange stranger straw stream street stress stretch strict strike
string stripe stroke strong structure struggle student studio study stuff stupid style subject submit
suburb succeed success sudden suffer sugar suggest suit suitable summer summit sun sunrise sunset
supper supply support suppose sure surface surgeon surname surprise surround survey survive suspect
swallow swamp swan swear sweat sweep sweet swim swing switch sword symbol system table talent tank
tape target task taste tax tea teach tear technology temple tempt tenant tend tender tense tent term
terrace terrible terror test text theatre theory thick thief thigh thin thing think thirst thread
threat threaten throat throne throw thumb thunder ticket tide tidy tight tile timber tiny tip tired
tissue title toast tobacco toe toilet tomato tongue tool tooth top topic torch total touch tough tour
tourist toward towel tower toy trace track trade tradition traffic trail train trait translate trap
tray treasure treat treaty tree trend trial tribe trick trip trolley troop trophy trouble truck true
trumpet trunk trust truth tube tunnel turkey turtle twin twist type tyre ugly umbrella uncle uncover
uniform union unite universal universe university unless unusual upset urban urge useful usual vacant
vague valid valley valuable value valve van vanish variety various vary vase vast vegetable vehicle
veil vein velvet vendor verse version vertical vessel veteran victim victory video view village vine
vinegar violence violin virtue virus visible vision visit visual vital vivid vocabulary voice volcano
volume volunteer vote voyage wage wagon waist waiter wake warn warrior wash waste wave wax weak weapon
web wedding weed weekend weight weird welfare whale wheat wheel whip whisper whistle whole wide widow
width wild willing willow wind window wine wing wink wire wisdom wise wish wit wolf wonder wood wool
worry worship worth wound wrap wreck wrist writer yield youth zebra zone
`;

  const javascript = `
const let var function return if else for while do break continue class extends new this super
import export default from async await try catch finally throw typeof instanceof null undefined true
false NaN Infinity of in delete void yield static get set arguments document window console Math JSON
Object Array String Number Boolean Promise Map Set Symbol Error length push pop map filter reduce
forEach slice splice join split indexOf includes replace match test charAt querySelector
addEventListener forEach console.log sort keys values entries assign freeze parseInt
= == === != !== <= >= && || ?? ?. ++ -- += -= *= /= %= => ... ; , . : ? ( ) [ ] { } + - * / % ! < >
`;

  const python = `
def return if elif else for while in not and or is None True False class import from as try except
finally raise with lambda yield global nonlocal pass break continue del assert async await print len
range str int float bool list dict set tuple enumerate zip sorted sum min max abs round input open
self init repr format append extend insert remove pop keys values items get update split strip join
replace lower upper startswith endswith isinstance type super
= == != <= >= + - * / // % ** += -= *= /= //= **= : , . ( ) [ ] { } -> # @
`;

  const html = `
<div </div> <p </p> <span </span> <a href="" </a> <html> <head> <body> <title> <meta> <link> <script>
<style> <img src="" alt=""> <ul> <li> <table> <tr> <td> <th> <form> <input> <button> <label> <section>
<header> <footer> <nav> <main> <article> <aside> <class=""> <id=""> <type=""> <name=""> <value="">
<!DOCTYPE html> <!-- --> role="" aria-label="" data-
`;

  const css = `
color background-color margin padding display flex grid position absolute relative fixed border
border-radius font-size font-family font-weight width height max-width min-height transition transform
opacity z-index cursor overflow box-shadow gap align-items justify-content text-align letter-spacing
line-height inset content none block inline flex auto inherit hidden solid 1rem 0.5rem 100% calc
: ; { } ( ) var(--main-color) .class #id @media hover
`;

  const sql = `
SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE PRIMARY KEY FOREIGN KEY JOIN LEFT
RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT AS AND OR NOT NULL DISTINCT COUNT SUM AVG MAX MIN
UNIQUE INDEX DROP ALTER ADD COLUMN BETWEEN LIKE IN IS EXISTS CASE WHEN THEN ELSE END ASC DESC
, ; ( ) * = < > ' ' 
`;

  /* Duplicate words are dropped, and order is preserved so that "english 200"
     really is the 200 most frequent words. */
  function dedupe(words) {
    const seen = Object.create(null);
    return words.filter(function (w) {
      if (!w || seen[w]) return false;
      seen[w] = true;
      return true;
    });
  }

  function toWords(blob) {
    return dedupe(blob.trim().split(/\s+/));
  }

  const englishWords = toWords(english + englishExtra + englishExtra2);

  MT.languages = {
    english: {
      name: "english",
      label: "english",
      words: englishWords,
    },
    english_200: {
      name: "english_200",
      label: "english 200",
      words: englishWords.slice(0, 200),
    },
    english_long: {
      name: "english_long",
      label: "english + long words",
      words: dedupe(englishWords.concat([
        "abundant", "accomplish", "acknowledge", "adaptation", "additional", "advantage", "adventure",
        "advertise", "afternoon", "agriculture", "alternative", "ambitious", "analysis", "announcement",
        "appreciate", "appropriate", "architecture", "argument", "arrangement", "association", "assumption",
        "atmosphere", "attractive", "authority", "available", "awareness", "background", "beautiful",
        "beneficial", "boundary", "brilliant", "calculation", "campaign", "capability", "celebration",
        "challenge", "characteristic", "combination", "comfortable", "commitment", "communication",
        "community", "comparison", "competition", "complicated", "concentrate", "conclusion", "condition",
        "conference", "confidence", "consequence", "considerable", "consistent", "constitution",
        "construction", "contemporary", "contribution", "convenient", "conversation", "cooperation",
        "corporation", "correspond", "courageous", "creation", "creativity", "critical", "cultural",
        "curriculum", "decision", "declaration", "dedication", "definition", "democracy", "demonstrate",
        "department", "description", "destination", "determination", "development", "difference",
        "difficulty", "dimension", "direction", "discipline", "discovery", "discussion", "distance",
        "distinguish", "distribution", "document", "domestic", "dramatic", "economic", "education",
        "effective", "efficiency", "election", "electricity", "element", "emergency", "emotion",
        "emphasis", "employment", "encounter", "encourage", "energy", "engagement", "enormous",
        "enterprise", "enthusiasm", "environment", "equipment", "essential", "establish", "evaluation",
        "eventually", "evidence", "evolution", "examine", "excellent", "exception", "exchange",
        "excitement", "executive", "exercise", "exhibition", "expansion", "experience", "experiment",
        "explanation", "expression", "extension", "external", "extraordinary", "familiar", "fascinating",
        "foundation", "frequency", "fundamental", "generation", "gentleman", "gradually", "gratitude",
        "guarantee", "guidance", "happiness", "harmony", "headquarters", "historical", "horizontal",
        "hospital", "household", "hypothesis", "identical", "identification", "illustration", "imagination",
        "immediate", "importance", "impression", "improvement", "incident", "independence", "indication",
        "individual", "industry", "influence", "information", "initial", "innovation", "inspiration",
        "installation", "institution", "instruction", "instrument", "insurance", "intelligence",
        "intention", "interaction", "interpretation", "introduction", "investigation", "involvement",
        "judgment", "knowledge", "laboratory", "leadership", "legislation", "liberty", "literature",
        "magnificent", "maintenance", "management", "manufacture", "material", "mathematics", "mechanism",
        "medicine", "membership", "memorable", "metaphor", "military", "minister", "minority", "miracle",
        "mysterious", "narrative", "national", "necessary", "negotiation", "neighbour", "nevertheless",
        "objective", "observation", "occasion", "operation", "opportunity", "opposition", "organization",
        "orientation", "original", "outstanding", "particular", "passenger", "performance", "permanent",
        "permission", "personality", "perspective", "phenomenon", "philosophy", "photograph", "physical",
        "political", "population", "practical", "preference", "preparation", "presence", "president",
        "pressure", "principle", "priority", "privilege", "procedure", "profession", "professor",
        "progress", "prominent", "proposal", "protection", "provision", "publication", "purchase",
        "quality", "quantity", "questionnaire", "recognize", "recommendation", "reference", "reflection",
        "reform", "regulation", "relationship", "relative", "religious", "remainder", "remarkable",
        "representative", "reputation", "requirement", "resistance", "resolution", "resource", "response",
        "responsibility", "restaurant", "restriction", "revenue", "revolution", "sacrifice", "satisfaction",
        "schedule", "scientific", "secretary", "security", "sensitive", "separate", "sequence",
        "significant", "similar", "situation", "society", "solution", "sophisticated", "souvenir",
        "specific", "spectacular", "spiritual", "standard", "statement", "statistics", "strategy",
        "strength", "structure", "struggle", "subsequent", "substance", "substantial", "successful",
        "sufficient", "suggestion", "summary", "superior", "supplement", "supporter", "surprising",
        "surrounding", "survivor", "suspicious", "symbolic", "sympathy", "technique", "technology",
        "temporary", "tendency", "territory", "therefore", "thorough", "threshold", "tolerance",
        "tomorrow", "tradition", "tragedy", "transaction", "transfer", "transformation", "translation",
        "transportation", "tremendous", "triumph", "tropical", "ultimately", "unbelievable", "underground",
        "understand", "unemployment", "unexpected", "unfortunately", "unique", "universal", "universe",
        "university", "unusual", "valuable", "variation", "variety", "vegetable", "vehicle", "version",
        "vertical", "victory", "violence", "virtually", "vocabulary", "voluntary", "volunteer",
        "vulnerable", "warranty", "weakness", "wealthy", "welcome", "widespread", "withdrawal",
        "wonderful", "workshop", "yesterday",
      ])),
    },
    javascript: { name: "javascript", label: "javascript", code: true, words: toWords(javascript) },
    python: { name: "python", label: "python", code: true, words: toWords(python) },
    html: { name: "html", label: "html", code: true, words: toWords(html) },
    css: { name: "css", label: "css", code: true, words: toWords(css) },
    sql: { name: "sql", label: "sql", code: true, words: toWords(sql) },
  };

  /* order shown in the language dropdown */
  MT.languageOrder = [
    "english",
    "english_200",
    "english_long",
    "javascript",
    "python",
    "html",
    "css",
    "sql",
  ];

  MT.getLanguage = function (name) {
    return MT.languages[name] || MT.languages.english;
  };
})();
