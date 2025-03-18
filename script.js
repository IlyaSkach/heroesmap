import { hotspotData } from "./hotspotData.js";

let globalKrpano;

// Добавляем глобальную переменную для текущего индекса
let currentPersonIndex = 0;

embedpano({
  xml: "pano.xml",
  target: "pano",
  html5: "only",
  consolelog: true,
  onready: function (krpano) {
    console.log("krpano загружен и готов");
    globalKrpano = krpano;

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

          // Обработчики наведения с анимацией
          hs.onover = () => {
            hs.scale = 1.3;

            // Получаем экранные координаты хотспота
            let screenpos = krpano.spheretoscreen(hs.ath, hs.atv);
            if (screenpos) {
              label.style.display = "block";
              label.style.left = screenpos.x + "px";
              label.style.top = screenpos.y - 40 + "px";

              // Добавляем небольшую задержку для анимации
              setTimeout(() => {
                label.classList.add("visible");
              }, 10);
            }
          };

          hs.onout = () => {
            hs.scale = 1.0;
            label.classList.remove("visible");

            // Ждем окончания анимации перед скрытием
            setTimeout(() => {
              label.style.display = "none";
            }, 300);
          };

          // Добавляем текстовый элемент на страницу
          document.getElementById("pano").appendChild(label);

          console.log(`Хотспот ${person.name} настроен:`, {
            ath: hs.ath,
            atv: hs.atv,
          });

          // В обработчике клика хотспота добавим:
          hs.onclick = () => {
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
  const panoElement = document.getElementById("pano");
  const cardElement = document.querySelector(".person-card");

  panoElement.classList.remove("shifted");
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

// Функция для отображения карточки персонажа
function showPersonCard(person, index) {
  const panoElement = document.getElementById("pano");
  const cardElement = document.querySelector(".person-card");
  const nameElement = cardElement.querySelector(".person-name");
  const regionElement = cardElement.querySelector(".person-region");
  const professionElement = cardElement.querySelector(".person-profession");
  const descriptionElement = cardElement.querySelector(".person-description");
  const imageElement = cardElement.querySelector(".person-image");
  const starRating = cardElement.querySelector(".star-rating");

  // Обновляем текущий индекс
  currentPersonIndex = index;

  // Заполняем данные
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

  person.videos.forEach((video) => {
    const thumbnail = document.createElement("div");
    thumbnail.className = "video-thumbnail";
    thumbnail.style.backgroundImage = `url(${video.thumbnail})`;
    thumbnail.setAttribute("data-video", video.videoUrl);
    thumbnail.setAttribute("data-title", video.title);

    thumbnail.onclick = () => {
      const modal = document.querySelector(".video-modal");
      const videoPlayer = document.getElementById("video-player");
      videoPlayer.src = video.videoUrl;
      modal.classList.add("active");
      videoPlayer.play();
    };

    videosContainer.appendChild(thumbnail);
  });

  // Анимируем появление
  panoElement.classList.add("shifted");
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
    showPersonCard(hotspotData[currentPersonIndex - 1], currentPersonIndex - 1);
  }
});

document.querySelector(".next-button").addEventListener("click", () => {
  if (currentPersonIndex < hotspotData.length - 1) {
    showPersonCard(hotspotData[currentPersonIndex + 1], currentPersonIndex + 1);
  }
});
