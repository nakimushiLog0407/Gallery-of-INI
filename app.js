const calendar = document.getElementById("calendar");
const currentMonth = document.getElementById("currentMonth");
const selectedDate = document.getElementById("selectedDate");
const supplyList = document.getElementById("supplyList");

const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");

const monthPickerButton = document.getElementById("monthPickerButton");
const monthPicker = document.getElementById("monthPicker");
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const monthPickerCancel = document.getElementById("monthPickerCancel");
const monthPickerGo = document.getElementById("monthPickerGo");

const calendarView = document.getElementById("calendarView");
const exploreView = document.getElementById("exploreView");
const detailView = document.getElementById("detailView");
const bottomNav = document.getElementById("bottomNav");

const calendarNavButton = document.getElementById("calendarNavButton");
const exploreNavButton = document.getElementById("exploreNavButton");

const exploreSearchInput = document.getElementById("exploreSearchInput");
const exploreResultLabel = document.getElementById("exploreResultLabel");
const exploreResultCount = document.getElementById("exploreResultCount");
const exploreList = document.getElementById("exploreList");
const exploreLoadMore = document.getElementById("exploreLoadMore");

const exploreCategoryButton =
  document.getElementById("exploreCategoryButton");

const exploreCategoryLabel =
  document.getElementById("exploreCategoryLabel");

const categorySheet =
  document.getElementById("categorySheet");

const categorySheetClose =
  document.getElementById("categorySheetClose");

const categorySheetOptions =
  document.querySelectorAll(".category-sheet-option");

const detailBackButton =
  document.getElementById("detailBackButton");

const detailThumbnailWrapper =
  document.getElementById("detailThumbnailWrapper");

const detailThumbnail =
  document.getElementById("detailThumbnail");

const detailType =
  document.getElementById("detailType");

const detailTitle =
  document.getElementById("detailTitle");

const detailDate =
  document.getElementById("detailDate");

const detailMember =
  document.getElementById("detailMember");

const detailExternalLink =
  document.getElementById("detailExternalLink");

const detailExternalLinkText =
  document.getElementById("detailExternalLinkText");


/* ==========================================================
   Schedule DETAIL
========================================================== */

const detailScheduleMembers =
  document.getElementById("detailScheduleMembers");

const detailScheduleMembersText =
  document.getElementById("detailScheduleMembersText");

const detailScheduleText =
  document.getElementById("detailScheduleText");

const detailScheduleXPosts =
  document.getElementById("detailScheduleXPosts");

const detailScheduleXPostsList =
  document.getElementById("detailScheduleXPostsList");

const detailScheduleLinks =
  document.getElementById("detailScheduleLinks");

const detailScheduleLinksList =
  document.getElementById("detailScheduleLinksList");


/* ==========================================================
   基本データ
========================================================== */

let supplies = [];

/*
  Scheduleに手動で関連付ける
  X投稿URL一覧。
*/
let scheduleXLinks = [];

const today = new Date();

let displayYear = today.getFullYear();
let displayMonth = today.getMonth();

let selectedDateKey = formatDateKey(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

let currentMainView = "calendar";

const EXPLORE_PAGE_SIZE = 50;

let exploreVisibleCount = EXPLORE_PAGE_SIZE;
let selectedExploreCategory = "all";

const exploreCategoryNames = {
  all: "すべて",
  youtube: "YouTube",
  member_diary: "Member Diary",
  movie: "Movie",
  radio: "Radio",
  photo: "Photo",
  message: "Message",
  schedule: "Schedule"
};


/* ==========================================================
   JSON
========================================================== */

async function fetchJson(path) {
  const response = await fetch(
    `${path}?v=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `${path} を読み込めませんでした。HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      `${path} の形式が不正です。`
    );
  }

  return data;
}


async function loadSupplyFile(path, label) {
  try {
    const data = await fetchJson(path);

    console.log(
      `${label}: ${data.length}件読み込み`
    );

    return data;
  } catch (error) {
    console.error(
      `${label}の読み込みに失敗しました。`,
      error
    );

    /*
      1ファイルの失敗でアプリ全体を
      停止させない。
    */
    return [];
  }
}


async function loadSupplies() {
  const [
    youtubeSupplies,
    memberDiarySupplies,
    movieSupplies,
    radioSupplies,
    photoSupplies,
    messageSupplies,
    scheduleSupplies,
    loadedScheduleXLinks
  ] = await Promise.all([
    loadSupplyFile(
      "data/youtube.json",
      "YouTube"
    ),

    loadSupplyFile(
      "data/member_diary.json",
      "Member Diary"
    ),

    loadSupplyFile(
      "data/movie.json",
      "Movie"
    ),

    loadSupplyFile(
      "data/radio.json",
      "Radio"
    ),

    loadSupplyFile(
      "data/photo.json",
      "Photo"
    ),

    loadSupplyFile(
      "data/message.json",
      "Message"
    ),

    loadSupplyFile(
      "data/schedule.json",
      "Schedule"
    ),

    loadSupplyFile(
      "data/schedule_x_links.json",
      "Schedule X Links"
    )
  ]);

  /*
    Xリンクは供給データそのものではないため
    suppliesには混ぜない。
  */
  scheduleXLinks =
    loadedScheduleXLinks;

  supplies = [
    ...youtubeSupplies,
    ...memberDiarySupplies,
    ...movieSupplies,
    ...radioSupplies,
    ...photoSupplies,
    ...messageSupplies,
    ...scheduleSupplies
  ];

  console.log(
    `全供給データ: ${supplies.length}件`
  );

  console.log(
    `Schedule X Links: ${scheduleXLinks.length}件`
  );

  /*
    Scheduleを含むデータを読み込んだ後、
    年月選択肢を作り直す。

    これにより翌年以降のScheduleが
    JSONに存在する場合も選択できる。
  */

  createMonthPickerOptions();

  /*
    データ取得後、
    現在表示している画面だけ更新する。
  */

  if (currentMainView === "calendar") {
    renderCalendar();
    renderSelectedDate();
  }

  if (currentMainView === "explore") {
    renderExplore();
  }
}


/* ==========================================================
   日付
========================================================== */

function formatDateKey(year, month, day) {
  const formattedMonth =
    String(month + 1).padStart(2, "0");

  const formattedDay =
    String(day).padStart(2, "0");

  return `${year}-${formattedMonth}-${formattedDay}`;
}


function formatDisplayDate(dateString) {
  if (!dateString) {
    return "";
  }

  const [
    year,
    month,
    day
  ] = dateString
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return dateString;
  }

  return `${year}年${month}月${day}日`;
}


/* ==========================================================
   供給の並び順
========================================================== */

function compareSuppliesAscending(a, b) {
  const aDate =
    a.publishedAt ||
    a.date ||
    "";

  const bDate =
    b.publishedAt ||
    b.date ||
    "";

  const dateComparison =
    aDate.localeCompare(bDate);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return String(
    a.id || ""
  ).localeCompare(
    String(b.id || ""),
    "ja",
    {
      numeric: true
    }
  );
}


/* ==========================================================
   FC Contents判定
========================================================== */

function isFcSupply(supply) {
  return (
    supply.group === "fc" ||
    supply.type === "member_diary" ||
    supply.type === "movie" ||
    supply.type === "radio" ||
    supply.type === "photo" ||
    supply.type === "message"
  );
}


/* ==========================================================
   CALENDAR
========================================================== */

function renderCalendar() {
  /*
    描画対象が存在しない場合は
    JavaScript全体を止めない。
  */

  if (!calendar || !currentMonth) {
    console.error(
      "カレンダー用DOMが見つかりません。"
    );

    return;
  }

  calendar.innerHTML = "";

  currentMonth.textContent =
    `${displayYear}年${displayMonth + 1}月`;

  const firstDay = new Date(
    displayYear,
    displayMonth,
    1
  );

  const lastDate = new Date(
    displayYear,
    displayMonth + 1,
    0
  ).getDate();

  /*
    JavaScriptのgetDay()
    0 = 日曜日
    1 = 月曜日
    ...
    6 = 土曜日

    カレンダーは月曜始まりなので変換。
  */

  const startPosition =
    (firstDay.getDay() + 6) % 7;


  /* 月初より前の空セル */

  for (
    let i = 0;
    i < startPosition;
    i++
  ) {
    const emptyCell =
      document.createElement("div");

    emptyCell.className =
      "calendar-day empty";

    calendar.appendChild(
      emptyCell
    );
  }


  /* 日付セル */

  for (
    let day = 1;
    day <= lastDate;
    day++
  ) {
    const dateKey =
      formatDateKey(
        displayYear,
        displayMonth,
        day
      );

    const dayButton =
      document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "calendar-day";


    /* 今日 */

    if (
      displayYear === today.getFullYear() &&
      displayMonth === today.getMonth() &&
      day === today.getDate()
    ) {
      dayButton.classList.add("today");
    }


    /* 選択日 */

    if (dateKey === selectedDateKey) {
      dayButton.classList.add("selected");
    }


    const dayNumber =
      document.createElement("span");

    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);

    dayButton.appendChild(
      dayNumber
    );


    /* YouTube */

    const hasYouTube =
      supplies.some(
        supply =>
          supply.date === dateKey &&
          supply.type === "youtube"
      );


    /* FC Contents */

    const hasFcContents =
      supplies.some(
        supply =>
          supply.date === dateKey &&
          isFcSupply(supply)
      );


    /* Schedule */

    const hasSchedule =
      supplies.some(
        supply =>
          supply.date === dateKey &&
          supply.type === "schedule"
      );


    if (
      hasYouTube ||
      hasFcContents ||
      hasSchedule
    ) {
      const dots =
        document.createElement("div");

      dots.className = "supply-dots";


      if (hasYouTube) {
        const youtubeDot =
          document.createElement("span");

        youtubeDot.className =
          "dot youtube-dot";

        dots.appendChild(
          youtubeDot
        );
      }


      if (hasFcContents) {
        const fcDot =
          document.createElement("span");

        fcDot.className =
          "dot fc-dot";

        dots.appendChild(
          fcDot
        );
      }


      if (hasSchedule) {
        const scheduleDot =
          document.createElement("span");

        scheduleDot.className =
          "dot schedule-dot";

        dots.appendChild(
          scheduleDot
        );
      }


      dayButton.appendChild(
        dots
      );
    }


    dayButton.addEventListener(
      "click",
      () => {
        selectedDateKey = dateKey;

        renderCalendar();
        renderSelectedDate();
      }
    );


    calendar.appendChild(
      dayButton
    );
  }
}


/* ==========================================================
   CALENDAR下部一覧
========================================================== */

function createSupplyItem(
  supply,
  fromView,
  showMember = false
) {
  const item =
    document.createElement("button");

  item.type = "button";
  item.className = "supply-item";


  const text =
    document.createElement("span");

  text.className =
    "supply-item-text";


  const title =
    document.createElement("span");

  title.className =
    "supply-title";

  title.textContent =
    supply.title || "";

  text.appendChild(title);


  if (
    showMember &&
    supply.member
  ) {
    const member =
      document.createElement("span");

    member.className =
      "supply-member";

    member.textContent =
      supply.member;

    text.appendChild(member);
  }


  if (
    supply.type === "schedule" &&
    Array.isArray(supply.members) &&
    supply.members.length > 0
  ) {
    const member =
      document.createElement("span");

    member.className =
      "supply-member";

    member.textContent =
      supply.members.join("・");

    text.appendChild(member);
  }


  const arrow =
    document.createElement("span");

  arrow.className =
    "supply-arrow";

  arrow.textContent = "›";


  item.appendChild(text);
  item.appendChild(arrow);


  item.addEventListener(
    "click",
    () => {
      openDetail(
        supply,
        fromView
      );
    }
  );


  return item;
}


function appendSupplyCategory(
  title,
  categorySupplies,
  showMember = false
) {
  if (
    categorySupplies.length === 0
  ) {
    return;
  }


  const category =
    document.createElement("div");

  category.className =
    "supply-category";


  const categoryTitle =
    document.createElement("div");

  categoryTitle.className =
    "supply-category-title";


  let dotClass = "fc-dot";

  if (title === "YouTube") {
    dotClass = "youtube-dot";
  }

  if (title === "Schedule") {
    dotClass = "schedule-dot";
  }


  categoryTitle.innerHTML = `
    <span class="dot ${dotClass}"></span>
    <span>${title}</span>
  `;


  category.appendChild(
    categoryTitle
  );


  categorySupplies.forEach(
    supply => {
      category.appendChild(
        createSupplyItem(
          supply,
          "calendar",
          showMember
        )
      );
    }
  );


  supplyList.appendChild(
    category
  );
}


function renderSelectedDate() {
  if (
    !selectedDate ||
    !supplyList
  ) {
    return;
  }

  selectedDate.textContent =
    formatDisplayDate(
      selectedDateKey
    );


  const selectedSupplies =
    supplies
      .filter(
        supply =>
          supply.date ===
          selectedDateKey
      )
      .sort(
        compareSuppliesAscending
      );


  supplyList.innerHTML = "";


  if (
    selectedSupplies.length === 0
  ) {
    supplyList.innerHTML = `
      <p class="no-supplies">
        この日の供給はありません。
      </p>
    `;

    return;
  }


  const youtubeSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "youtube"
    );

  const memberDiarySupplies =
    selectedSupplies.filter(
      supply =>
        supply.type ===
        "member_diary"
    );

  const movieSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "movie"
    );

  const radioSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "radio"
    );

  const photoSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "photo"
    );

  const messageSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "message"
    );

  const scheduleSupplies =
    selectedSupplies.filter(
      supply =>
        supply.type === "schedule"
    );


  appendSupplyCategory(
    "YouTube",
    youtubeSupplies
  );

  appendSupplyCategory(
    "Member Diary",
    memberDiarySupplies,
    true
  );

  appendSupplyCategory(
    "Movie",
    movieSupplies
  );

  appendSupplyCategory(
    "Radio",
    radioSupplies
  );

  appendSupplyCategory(
    "Photo",
    photoSupplies
  );

  appendSupplyCategory(
    "Message",
    messageSupplies
  );

  appendSupplyCategory(
    "Schedule",
    scheduleSupplies
  );
}


/* ==========================================================
   EXPLORE
========================================================== */

function matchesExploreCategory(
  supply
) {
  if (
    selectedExploreCategory ===
    "all"
  ) {
    return true;
  }

  return (
    supply.type ===
    selectedExploreCategory
  );
}


function getExploreSupplies() {
  const rawQuery =
    exploreSearchInput
      .value
      .trim()
      .toLocaleLowerCase();


  const sortedSupplies =
    [...supplies].sort(
      (a, b) => {
        const aDate =
          a.publishedAt ||
          a.date ||
          "";

        const bDate =
          b.publishedAt ||
          b.date ||
          "";

        const dateComparison =
          bDate.localeCompare(
            aDate
          );

        if (
          dateComparison !== 0
        ) {
          return dateComparison;
        }


        return String(
          b.id || ""
        ).localeCompare(
          String(a.id || ""),
          "ja",
          {
            numeric: true
          }
        );
      }
    );


  const categoryFiltered =
    sortedSupplies.filter(
      matchesExploreCategory
    );


  if (!rawQuery) {
    return categoryFiltered;
  }


  const keywords =
    rawQuery
      .split(/\s+/)
      .filter(Boolean);


  return categoryFiltered.filter(
    supply => {
      const title =
        String(
          supply.title || ""
        ).toLocaleLowerCase();


      if (
        supply.type ===
        "member_diary"
      ) {
        const member =
          String(
            supply.member || ""
          ).toLocaleLowerCase();

        const searchText =
          `${title} ${member}`;

        return keywords.every(
          keyword =>
            searchText.includes(
              keyword
            )
        );
      }


      if (
        supply.type ===
        "schedule"
      ) {
        const members =
          Array.isArray(
            supply.members
          )
            ? supply.members.join(" ")
            : "";

        const categoryLabel =
          String(
            supply.categoryLabel || ""
          );

        const searchText =
          `${title} ${members} ${categoryLabel}`
            .toLocaleLowerCase();

        return keywords.every(
          keyword =>
            searchText.includes(
              keyword
            )
        );
      }


      return keywords.every(
        keyword =>
          title.includes(keyword)
      );
    }
  );
}


function setExploreItemCategory(
  category,
  supply
) {
  if (
    supply.type === "youtube"
  ) {
    category.innerHTML = `
      <span class="dot youtube-dot"></span>
      <span>YouTube</span>
    `;

    return;
  }


  if (
    supply.type === "schedule"
  ) {
    const scheduleLabel =
      supply.categoryLabel
        ? `Schedule / ${supply.categoryLabel}`
        : "Schedule";

    category.innerHTML = `
      <span class="dot schedule-dot"></span>
      <span>${scheduleLabel}</span>
    `;

    return;
  }


  const fcCategoryNames = {
    member_diary:
      "Member Diary",
    movie:
      "Movie",
    radio:
      "Radio",
    photo:
      "Photo",
    message:
      "Message"
  };


  if (
    fcCategoryNames[
      supply.type
    ]
  ) {
    category.innerHTML = `
      <span class="dot fc-dot"></span>
      <span>${fcCategoryNames[supply.type]}</span>
    `;

    return;
  }


  category.textContent =
    supply.type || "";
}


function renderExplore() {
  if (
    !exploreSearchInput ||
    !exploreResultLabel ||
    !exploreResultCount ||
    !exploreList ||
    !exploreLoadMore
  ) {
    return;
  }


  const query =
    exploreSearchInput
      .value
      .trim();

  const filteredSupplies =
    getExploreSupplies();


  if (query) {
    exploreResultLabel.textContent =
      "SEARCH RESULTS";
  } else if (
    selectedExploreCategory ===
    "all"
  ) {
    exploreResultLabel.textContent =
      "ALL";
  } else {
    exploreResultLabel.textContent =
      exploreCategoryNames[
        selectedExploreCategory
      ] ||
      "ALL";
  }


  exploreResultCount.textContent =
    `${filteredSupplies.length.toLocaleString()}件`;

  exploreList.innerHTML = "";


  if (
    filteredSupplies.length === 0
  ) {
    exploreList.innerHTML = `
      <p class="explore-empty">
        該当する供給はありません。
      </p>
    `;

    exploreLoadMore.hidden = true;

    return;
  }


  const visibleSupplies =
    filteredSupplies.slice(
      0,
      exploreVisibleCount
    );


  visibleSupplies.forEach(
    supply => {
      const item =
        document.createElement("button");

      item.type = "button";
      item.className = "explore-item";


      const date =
        document.createElement("span");

      date.className =
        "explore-item-date";

      date.textContent =
        formatDisplayDate(
          supply.date
        );


      const category =
        document.createElement("span");

      category.className =
        "explore-item-category";

      setExploreItemCategory(
        category,
        supply
      );


      const main =
        document.createElement("span");

      main.className =
        "explore-item-main";


      const text =
        document.createElement("span");

      text.className =
        "explore-item-text";


      const title =
        document.createElement("span");

      title.className =
        "explore-item-title";

      title.textContent =
        supply.title || "";

      text.appendChild(title);


      if (
        supply.type ===
          "member_diary" &&
        supply.member
      ) {
        const member =
          document.createElement("span");

        member.className =
          "explore-item-member";

        member.textContent =
          supply.member;

        text.appendChild(member);
      }


      if (
        supply.type === "schedule" &&
        Array.isArray(supply.members) &&
        supply.members.length > 0
      ) {
        const member =
          document.createElement("span");

        member.className =
          "explore-item-member";

        member.textContent =
          supply.members.join("・");

        text.appendChild(member);
      }


      const arrow =
        document.createElement("span");

      arrow.className =
        "explore-item-arrow";

      arrow.textContent = "›";


      main.appendChild(text);
      main.appendChild(arrow);

      item.appendChild(date);
      item.appendChild(category);
      item.appendChild(main);


      item.addEventListener(
        "click",
        () => {
          openDetail(
            supply,
            "explore"
          );
        }
      );


      exploreList.appendChild(
        item
      );
    }
  );


  exploreLoadMore.hidden =
    exploreVisibleCount >=
    filteredSupplies.length;
}


/* ==========================================================
   EXPLOREイベント
========================================================== */

exploreSearchInput.addEventListener(
  "input",
  () => {
    exploreVisibleCount =
      EXPLORE_PAGE_SIZE;

    renderExplore();
  }
);


exploreLoadMore.addEventListener(
  "click",
  () => {
    exploreVisibleCount +=
      EXPLORE_PAGE_SIZE;

    renderExplore();
  }
);


/* ==========================================================
   カテゴリシート
========================================================== */

function openCategorySheet() {
  categorySheet.hidden = false;

  exploreCategoryButton.setAttribute(
    "aria-expanded",
    "true"
  );

  updateCategorySheetSelection();
}


function closeCategorySheet() {
  categorySheet.hidden = true;

  exploreCategoryButton.setAttribute(
    "aria-expanded",
    "false"
  );
}


function updateCategorySheetSelection() {
  categorySheetOptions.forEach(
    option => {
      const category =
        option.dataset.category;

      const check =
        option.querySelector(
          ".category-sheet-check"
        );

      const isSelected =
        category ===
        selectedExploreCategory;


      option.classList.toggle(
        "selected",
        isSelected
      );


      if (check) {
        check.textContent =
          isSelected
            ? "✓"
            : "";
      }
    }
  );


  exploreCategoryLabel.textContent =
    exploreCategoryNames[
      selectedExploreCategory
    ] ||
    "すべて";
}


excploreCateg