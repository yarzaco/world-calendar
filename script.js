document.addEventListener("DOMContentLoaded", async () => {
  const appContainer = document.getElementById("app-container")
  const langSelect = document.getElementById("lang-select")
  const countrySelect = document.getElementById("country-select")
  const navLinks = document.querySelectorAll(".nav-link")

  let holidaysData = {}
  let currentCountry = "colombia" // Default country
  const currentYear = new Date().getFullYear()

  // Declare i18next and Swal variables
  const i18next = window.i18next
  const Swal = window.Swal

  // --- Data Loading ---
  async function loadData() {
    try {
      const [holidaysRes, esRes, enRes] = await Promise.all([
        fetch("holidays.json"),
        fetch("locales/es.json"),
        fetch("locales/en.json"),
      ])

      holidaysData = await holidaysRes.json()
      const esTranslations = await esRes.json()
      const enTranslations = await enRes.json()

      // Initialize i18next
      await i18next.init({
        lng: "es", // default language
        fallbackLng: "en",
        debug: false,
        resources: {
          es: esTranslations,
          en: enTranslations,
        },
      })

      // Populate country selector
      for (const countryCode in holidaysData.countries) {
        const option = document.createElement("option")
        option.value = countryCode
        option.textContent = holidaysData.countries[countryCode].name
        countrySelect.appendChild(option)
      }

      // Set initial country based on a simple heuristic or default
      // For a real app, you'd use a geo-IP API here.
      // Example: if (navigator.language.startsWith('es')) currentCountry = 'colombia';
      // else if (navigator.language.startsWith('en')) currentCountry = 'usa';
      // For this example, we'll stick to default 'colombia' or user selection.
      countrySelect.value = currentCountry

      // Initial render based on URL
      handleRoute()
      updateTranslations()
    } catch (error) {
      console.error("Error loading data:", error)
      Swal.fire("Error", "Could not load application data. Please try again later.", "error")
    }
  }

  // --- Internationalization ---
  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n")
      element.textContent = i18next.t(key)
    })
    // Update dynamic content like calendar header
    renderCalendar()
  }

  langSelect.addEventListener("change", (event) => {
    i18next.changeLanguage(event.target.value, () => {
      updateTranslations()
      // Re-render current view to apply new language
      handleRoute()
    })
  })

  countrySelect.addEventListener("change", (event) => {
    currentCountry = event.target.value
    renderCalendar()
  })

  // --- Routing ---
  function handleRoute() {
    const path = window.location.pathname
    if (path === "/" || path === "/index.html") {
      renderCalendarView()
    } else if (path.startsWith("/articles/")) {
      renderArticleView(path)
    } else if (path.endsWith(".html")) {
      // For static HTML pages, we just let the browser load them
      // This SPA setup is primarily for the calendar and dynamic articles
      // If you want to handle these within the SPA, you'd fetch and inject their content
      // For now, they are separate physical files as requested.
      // We'll just ensure the app container is cleared if we navigate away.
      appContainer.innerHTML = ""
    } else {
      // Fallback for unknown routes, maybe redirect to home
      window.history.pushState({}, "", "/")
      renderCalendarView()
    }
  }

  // Intercept navigation for SPA routing
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href")
      if (href.startsWith("/") && !href.endsWith(".html")) {
        // Only intercept SPA routes
        event.preventDefault()
        window.history.pushState({}, "", href)
        handleRoute()
      }
      // For .html links, let default browser behavior take over
    })
  })

  window.addEventListener("popstate", handleRoute)

  // --- Calendar View ---
  function renderCalendarView() {
    appContainer.innerHTML = `
            <div class="calendar-view">
                <div class="calendar-header">
                    <button onclick="prevMonth()"><i class="fas fa-chevron-left"></i></button>
                    <h2 id="current-month-year"></h2>
                    <button onclick="nextMonth()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="calendar-grid" id="calendar-grid">
                    <div class="day-name">${i18next.t("translation.days.monday", { defaultValue: "Mon" })}</div>
                    <div class="day-name">${i18next.t("translation.days.tuesday", { defaultValue: "Tue" })}</div>
                    <div class="day-name">${i18next.t("translation.days.wednesday", { defaultValue: "Wed" })}</div>
                    <div class="day-name">${i18next.t("translation.days.thursday", { defaultValue: "Thu" })}</div>
                    <div class="day-name">${i18next.t("translation.days.friday", { defaultValue: "Fri" })}</div>
                    <div class="day-name">${i18next.t("translation.days.saturday", { defaultValue: "Sat" })}</div>
                    <div class="day-name">${i18next.t("translation.days.sunday", { defaultValue: "Sun" })}</div>
                </div>
            </div>
        `
    renderCalendar()
  }

  let currentMonth = new Date().getMonth() // 0-indexed
  let currentDisplayYear = new Date().getFullYear()

  window.prevMonth = () => {
    currentMonth--
    if (currentMonth < 0) {
      currentMonth = 11
      currentDisplayYear--
    }
    renderCalendar()
  }

  window.nextMonth = () => {
    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentDisplayYear++
    }
    renderCalendar()
  }

  function renderCalendar() {
    const calendarGrid = document.getElementById("calendar-grid")
    const currentMonthYearHeader = document.getElementById("current-month-year")

    if (!calendarGrid || !currentMonthYearHeader) return // Not in calendar view

    calendarGrid.innerHTML = `
            <div class="day-name">${i18next.t("translation.days.monday", { defaultValue: "Mon" })}</div>
            <div class="day-name">${i18next.t("translation.days.tuesday", { defaultValue: "Tue" })}</div>
            <div class="day-name">${i18next.t("translation.days.wednesday", { defaultValue: "Wed" })}</div>
            <div class="day-name">${i18next.t("translation.days.thursday", { defaultValue: "Thu" })}</div>
            <div class="day-name">${i18next.t("translation.days.friday", { defaultValue: "Fri" })}</div>
            <div class="day-name">${i18next.t("translation.days.saturday", { defaultValue: "Sat" })}</div>
            <div class="day-name">${i18next.t("translation.days.sunday", { defaultValue: "Sun" })}</div>
        ` // Clear and re-add day names

    const date = new Date(currentDisplayYear, currentMonth, 1)
    const firstDayOfMonth = date.getDay() // 0 for Sunday, 1 for Monday...
    const daysInMonth = new Date(currentDisplayYear, currentMonth + 1, 0).getDate()

    // Adjust firstDayOfMonth to be 0 for Monday, 6 for Sunday
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    currentMonthYearHeader.textContent = `${i18next.t(`translation.months.${currentMonth}`, { defaultValue: "Month" })} ${currentDisplayYear}`

    // Add empty days for the start of the month
    for (let i = 0; i < startDay; i++) {
      const emptyDiv = document.createElement("div")
      emptyDiv.classList.add("empty-day")
      calendarGrid.appendChild(emptyDiv)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDiv = document.createElement("div")
      dayDiv.classList.add("calendar-day")
      dayDiv.innerHTML = `<span class="day-number">${day}</span>`

      const monthPadded = String(currentMonth + 1).padStart(2, "0")
      const dayPadded = String(day).padStart(2, "0")
      const dateKey = `${monthPadded}-${dayPadded}`

      const countryHolidays = holidaysData.countries[currentCountry]?.holidays || []
      const holiday = countryHolidays.find((h) => h.date === dateKey)

      if (holiday) {
        const holidayInfo = document.createElement("div")
        holidayInfo.classList.add("holiday-info")
        holidayInfo.textContent = i18next.t(`translation.articles.${holiday.articleId}.shortText`, {
          defaultValue: "Holiday",
        })
        holidayInfo.dataset.articleId = holiday.articleId
        holidayInfo.dataset.country = currentCountry
        holidayInfo.dataset.seoSlug = holiday.seoSlug
        holidayInfo.dataset.date = dateKey // Store date for URL construction

        holidayInfo.addEventListener("click", (event) => {
          const articleId = event.target.dataset.articleId
          const country = event.target.dataset.country
          const seoSlug = event.target.dataset.seoSlug
          const date = event.target.dataset.date // e.g., 08-07

          const monthNum = date.split("-")[0]
          const dayNum = date.split("-")[1]
          const monthName = i18next.t(`translation.months.${Number.parseInt(monthNum) - 1}`, { defaultValue: "month" }) // Get translated month name
          const articlePath = `/articles/${country}/${dayNum}-${monthName.toLowerCase().replace(/\s/g, "-")}-${seoSlug}`

          window.history.pushState({ articleId, country, seoSlug, date }, "", articlePath)
          renderArticleView(articlePath)
        })
        dayDiv.appendChild(holidayInfo)
      }
      calendarGrid.appendChild(dayDiv)
    }
  }

  // --- Article View ---
  function renderArticleView(path) {
    const parts = path.split("/")
    // Expected path: /articles/country/day-month-slug
    if (parts.length < 4 || parts[1] !== "articles") {
      console.error("Invalid article path:", path)
      window.history.pushState({}, "", "/") // Redirect to home
      renderCalendarView()
      return
    }

    const countryCode = parts[2]
    const slugPart = parts[3] // e.g., 07-agosto-batalla-de-boyaca

    // Find the articleId based on country and seoSlug
    let foundArticleId = null
    let foundHoliday = null

    const countryHolidays = holidaysData.countries[countryCode]?.holidays || []
    for (const holiday of countryHolidays) {
      const monthNum = holiday.date.split("-")[0]
      const dayNum = holiday.date.split("-")[1]
      const monthName = i18next.t(`translation.months.${Number.parseInt(monthNum) - 1}`, { defaultValue: "month" })
      const expectedSlugPart = `${dayNum}-${monthName.toLowerCase().replace(/\s/g, "-")}-${holiday.seoSlug}`

      if (expectedSlugPart === slugPart) {
        foundArticleId = holiday.articleId
        foundHoliday = holiday
        break
      }
    }

    if (!foundArticleId) {
      console.error("Article not found for path:", path)
      Swal.fire("Error", "Article not found.", "error")
      window.history.pushState({}, "", "/") // Redirect to home
      renderCalendarView()
      return
    }

    const articleContent = i18next.t(`translation.articles.${foundArticleId}`, { returnObjects: true })

    if (!articleContent || !articleContent.title) {
      console.error("Article content not found in translations for ID:", foundArticleId)
      Swal.fire("Error", "Article content missing.", "error")
      window.history.pushState({}, "", "/") // Redirect to home
      renderCalendarView()
      return
    }

    const imageUrl = articleContent.image ? `images/${articleContent.image}` : "/placeholder.svg?height=400&width=600"

    appContainer.innerHTML = `
            <div class="article-view">
                <a href="/" class="back-button" data-i18n="backToCalendar"></a>
                <h1>${articleContent.title}</h1>
                <img src="${imageUrl}" alt="${articleContent.title}" class="article-image">
                <div class="article-content">
                    ${articleContent.content}
                </div>
            </div>
        `
    document.querySelector(".back-button").addEventListener("click", (event) => {
      event.preventDefault()
      window.history.pushState({}, "", "/")
      renderCalendarView()
    })
    updateTranslations() // Apply translations to the new article view
  }

  // --- Initial Load ---
  loadData()

  // --- Socket.IO (Client-side only, requires a server to connect to) ---
  // const socket = io('http://localhost:3000'); // Replace with your Socket.IO server URL
  // socket.on('connect', () => {
  //     console.log('Connected to Socket.IO server');
  // });
  // socket.on('disconnect', () => {
  //     console.log('Disconnected from Socket.IO server');
  // });
  // socket.on('message', (data) => {
  //     console.log('Message from server:', data);
  //     // Handle incoming messages
  // });
  // Example: socket.emit('clientMessage', 'Hello from client!');
})
