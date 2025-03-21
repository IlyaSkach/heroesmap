import { hotspotData } from "./hotspotData.js";

let globalKrpano;

// Добавляем глобальную переменную для текущего индекса
let currentPersonIndex = 0;

// Добавим глобальную переменную для хранения активного лейбла
let activeLabel = null;

// Добавляем обработчики для модального окна с паролем
document.addEventListener("DOMContentLoaded", () => {
  const addHeroBtn = document.getElementById("addHeroBtn");
  const passwordModal = document.getElementById("passwordModal");
  const passwordInput = document.getElementById("passwordInput");
  const errorMessage = document.getElementById("errorMessage");
  const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
  const submitPasswordBtn = document.getElementById("submitPasswordBtn");

  // Показываем модальное окно при клике на кнопку
  addHeroBtn.addEventListener("click", () => {
    passwordModal.classList.add("active");
    passwordInput.value = ""; // Очищаем поле пароля
    errorMessage.textContent = ""; // Очищаем сообщение об ошибке
  });

  // Закрываем модальное окно при клике на "Отмена"
  cancelPasswordBtn.addEventListener("click", () => {
    passwordModal.classList.remove("active");
  });

  // Проверяем пароль при подтверждении
  submitPasswordBtn.addEventListener("click", checkPassword);

  // Добавляем обработку клавиши Enter
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      checkPassword();
    }
  });

  function checkPassword() {
    const password = passwordInput.value;

    if (password === "admin") {
      // Правильный пароль
      window.location.href = "add-hero.html";
    } else {
      // Неправильный пароль
      errorMessage.textContent = "Нет доступа";
      passwordInput.value = ""; // Очищаем поле пароля

      // Добавляем анимацию встряхивания
      errorMessage.style.animation = "shake 0.5s";
      setTimeout(() => {
        errorMessage.style.animation = "";
      }, 500);
    }
  }
});

embedpano({
  xml: "pano.xml",
  target: "pano",
  html5: "only",
  consolelog: true,
  onready: function (krpano) {
    console.log("krpano загружен и готов");
    globalKrpano = krpano;

    // Добавляем обработчик обновления
    krpano.set("onviewchange", function () {
      updateActiveLabelPosition();
    });

    setTimeout(() => {
      if (!krpano) {
        console.error("krpano не инициализирован");
        return;
      }
      console.log("Начинаем добавление хотспотов...");

      // Добавляем хотспоты из данных
      hotspotData.forEach((person) => {
        console.log(`Попытка создания хотспота для ${person.name}`);
        let hs = krpano.addhotspot("spot" + person.id);

        if (hs) {
          console.log(`Хотспот для ${person.name} создан`);
          hs.url = "marker.png";
          hs.ath = person.ath;
          hs.atv = person.atv;
          hs.width = 30;
          hs.height = 30;
          hs.name = person.name;
          hs.scale = 1.0;
          hs.edge = "center";

          // Добавляем transition для плавного масштабирования
          hs.style = "transition: scale 0.3s ease-in-out;";

          // Создаем элемент для текста
          const label = document.createElement("div");
          label.className = "hotspot-label";
          label.innerHTML = person.name;
          label.setAttribute("data-hotspot-id", "spot" + person.id);

          // Обработчики наведения с анимацией
          hs.onover = () => {
            if (activeLabel !== label) {
              // Показываем только если это не активный лейбл
              hs.scale = 1.3;

              // Получаем экранные координаты хотспота
              let screenpos = krpano.spheretoscreen(hs.ath, hs.atv);
              if (screenpos) {
                label.style.display = "block";
                label.style.left = screenpos.x + "px";
                label.style.top = screenpos.y - 40 + "px";

                setTimeout(() => {
                  label.classList.add("visible");
                }, 10);
              }
            }
          };

          hs.onout = () => {
            if (activeLabel !== label) {
              // Скрываем только если это не активный лейбл
              hs.scale = 1.0;
              label.classList.remove("visible");

              setTimeout(() => {
                label.style.display = "none";
              }, 300);
            }
          };

          // Добавляем текстовый элемент на страницу
          document.getElementById("pano").appendChild(label);

          console.log(`Хотспот ${person.name} настроен:`, {
            ath: hs.ath,
            atv: hs.atv,
          });

          // В обработчике клика хотспота:
          hs.onclick = () => {
            globalKrpano.call(
              `lookto(${hs.ath}, ${hs.atv}, 0.1, tween(easeInOutQuad, 0.5), true, true)`
            );
            // Если был активный лейбл, скрываем его
            if (activeLabel && activeLabel !== label) {
              activeLabel.classList.remove("visible");
              activeLabel.style.display = "none";
            }

            // Устанавливаем новый активный лейбл
            activeLabel = label;

            // Показываем лейбл
            let screenpos = krpano.spheretoscreen(hs.ath, hs.atv);
            if (screenpos) {
              label.style.display = "block";
              label.style.left = screenpos.x + "px";
              label.style.top = screenpos.y - 40 + "px";
              label.classList.add("visible");
            }

            const personIndex = hotspotData.findIndex(
              (p) => p.id === person.id
            );
            showPersonCard(person, personIndex);
          };
        } else {
          console.error(`Не удалось создать хотспот для ${person.name}`);
        }
      });
    }, 1000);
  },
  onerror: function (message) {
    console.error("Ошибка загрузки krpano:", message);
  },
});

// Функция для получения координат при клике
function getClickCoordinates() {
  if (!globalKrpano) {
    console.error("krpano не инициализирован");
    return;
  }

  // Получаем координаты мыши
  let mouseX = globalKrpano.get("mouse.x");
  let mouseY = globalKrpano.get("mouse.y");

  // Конвертируем экранные координаты в сферические
  let result = globalKrpano.screentosphere(mouseX, mouseY);

  if (result && !isNaN(result.x) && !isNaN(result.y)) {
    console.log("Координаты для маркера:");
    console.log("ath =", result.x.toFixed(4));
    console.log("atv =", result.y.toFixed(4));
  } else {
    console.error("Не удалось получить координаты");
  }
}

// Добавляем обработчик для кнопки "Назад"
document.querySelector(".back-button").addEventListener("click", (e) => {
  e.preventDefault();
  const cardElement = document.querySelector(".person-card");

  // Скрываем активный лейбл при закрытии карточки
  if (activeLabel) {
    activeLabel.classList.remove("visible");
    activeLabel.style.display = "none";
    activeLabel = null;
  }

  cardElement.classList.remove("active");
});

// Добавляем обработчик закрытия модального окна
document.querySelector(".close-modal").addEventListener("click", () => {
  const modal = document.querySelector(".video-modal");
  const videoPlayer = document.getElementById("video-player");
  modal.classList.remove("active");
  videoPlayer.pause();
  videoPlayer.src = "";
});

// Добавим функцию обновления позиции активного лейбла
function updateActiveLabelPosition() {
  if (activeLabel && globalKrpano) {
    const activeHotspot = globalKrpano.get(
      `hotspot[spot${hotspotData[currentPersonIndex].id}]`
    );
    if (activeHotspot) {
      let screenpos = globalKrpano.spheretoscreen(
        activeHotspot.ath,
        activeHotspot.atv
      );
      if (screenpos) {
        activeLabel.style.left = screenpos.x + "px";
        activeLabel.style.top = screenpos.y - 40 + "px";
      }
    }
  }
}

// Функция для отображения карточки персонажа
function showPersonCard(person, index) {
  // Находим новый лейбл
  const newLabel = document.querySelector(
    `.hotspot-label[data-hotspot-id="spot${person.id}"]`
  );

  // Если был активный лейбл и это другая карточка, просто скрываем его
  if (activeLabel && activeLabel !== newLabel) {
    activeLabel.classList.remove("visible");
    activeLabel.style.display = "none";
  }

  // Устанавливаем новый активный лейбл
  activeLabel = newLabel;

  // Показываем новый лейбл сразу
  if (activeLabel) {
    const hotspot = globalKrpano.get(`hotspot[spot${person.id}]`);
    if (hotspot) {
      let screenpos = globalKrpano.spheretoscreen(hotspot.ath, hotspot.atv);
      if (screenpos) {
        activeLabel.style.display = "block";
        activeLabel.style.left = screenpos.x + "px";
        activeLabel.style.top = screenpos.y - 40 + "px";
        activeLabel.classList.add("visible");
      }
    }
  }

  // Обновляем текущий индекс
  currentPersonIndex = index;

  // Заполняем данные
  const cardElement = document.querySelector(".person-card");
  const nameElement = cardElement.querySelector(".person-name");
  const regionElement = cardElement.querySelector(".person-region");
  const professionElement = cardElement.querySelector(".person-profession");
  const descriptionElement = cardElement.querySelector(".person-description");
  const imageElement = cardElement.querySelector(".person-image");
  const starRating = cardElement.querySelector(".star-rating");

  nameElement.textContent = person.name;
  regionElement.textContent = person.region;
  professionElement.textContent = person.profession;
  descriptionElement.textContent = person.description;
  starRating.textContent = "★ " + person.rating;

  // Добавляем изображение
  if (person.image) {
    imageElement.style.backgroundImage = `url(${person.image})`;
  }

  // Обновляем видео
  const videosContainer = cardElement.querySelector(".videos-container");
  videosContainer.innerHTML = "";

  // Создаем контейнер для трех видео
  for (let i = 0; i < 3; i++) {
    const videoWrapper = document.createElement("div");
    videoWrapper.className = "video-wrapper";

    videoWrapper.innerHTML = `
      <iframe
        src="https://rutube.ru/play/embed/323cd8e74b1e344ab274858c53d328e5"
        width="280"
        height="157"
        frameborder="0"
        allow="clipboard-write; autoplay; fullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen
      ></iframe>
    `;

    videosContainer.appendChild(videoWrapper);
  }

  // Обновляем ссылки социальных сетей
  const socialIcons = cardElement.querySelectorAll(".social-icon");

  // Скрываем все иконки по умолчанию
  socialIcons.forEach((icon) => {
    icon.style.display = "none";
  });

  // Показываем только те иконки, для которых есть ссылки
  if (person.social) {
    const socialMap = {
      telegram: "iconsTG.svg",
      vk: "iconsVK.svg",
      ok: "iconsOK.svg",
      dzen: "iconsDZ.svg",
      rutube: "iconsRT.png",
    };

    socialIcons.forEach((icon) => {
      const img = icon.querySelector("img");
      const socialType = Object.entries(socialMap).find(([, value]) =>
        img.src.includes(value)
      )?.[0];

      if (socialType && person.social[socialType]) {
        icon.href = person.social[socialType];
        icon.style.display = "flex";
      }
    });
  }

  // Только добавляем класс active для карточки
  cardElement.classList.add("active");

  // Обновляем состояние кнопок навигации
  updateNavigation();
}

// Функция обновления состояния кнопок навигации
function updateNavigation() {
  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");

  prevButton.classList.toggle("disabled", currentPersonIndex === 0);
  nextButton.classList.toggle(
    "disabled",
    currentPersonIndex === hotspotData.length - 1
  );
}

// Обработчики для кнопок навигации
document.querySelector(".prev-button").addEventListener("click", () => {
  if (currentPersonIndex > 0) {
    const prevPerson = hotspotData[currentPersonIndex - 1];
    // Сначала анимируем камеру к метке
    globalKrpano.call(`
      getlooktodistance(dist2target, ${prevPerson.ath}, ${prevPerson.atv}, view.hlookat, view.vlookat);
      lookto(${prevPerson.ath}, ${prevPerson.atv}, calc(dist2target GT view.fov ? dist2target : 0.1), tween(easeInOutSine, 0.5), true, true,
          lookto(${prevPerson.ath}, ${prevPerson.atv}, 0.1, tween(easeInOutSine, 0.5), false, true)
      );
    `);

    // Затем показываем карточку с небольшой задержкой
    setTimeout(() => {
      showPersonCard(prevPerson, currentPersonIndex - 1);
    }, 500);
  }
});

document.querySelector(".next-button").addEventListener("click", () => {
  if (currentPersonIndex < hotspotData.length - 1) {
    const nextPerson = hotspotData[currentPersonIndex + 1];
    // Сначала анимируем камеру к метке

    globalKrpano.call(`
      getlooktodistance(dist2target, ${nextPerson.ath}, ${nextPerson.atv}, view.hlookat, view.vlookat);
      lookto(${nextPerson.ath}, ${nextPerson.atv}, calc(dist2target GT view.fov ? dist2target : 0.1), tween(easeInOutSine, 0.5), true, true,
          lookto(${nextPerson.ath}, ${nextPerson.atv}, 0.1, tween(easeInOutSine, 0.5), false, true)
      );
    `);

    // Затем показываем карточку с небольшой задержкой
    setTimeout(() => {
      showPersonCard(nextPerson, currentPersonIndex + 1);
    }, 500);
  }
});
