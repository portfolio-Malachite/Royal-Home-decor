const body = document.body;
const navbar = document.querySelector(".navbar");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-link, .nav-cta");
const revealItems = document.querySelectorAll(".reveal");
const yearNodes = document.querySelectorAll("[data-year]");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const debounce = (callback, delay = 150) => {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

const updateNavbarState = () => {
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 24);
};

const syncMenuState = () => {
  if (!navbar || !menuToggle) return;

  const isOpen = navbar.classList.contains("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
};

const closeMenu = () => {
  if (!navbar) return;

  navbar.classList.remove("menu-open");
  body.classList.remove("menu-open");
  syncMenuState();
};

menuToggle?.addEventListener("click", () => {
  navbar.classList.toggle("menu-open");
  body.classList.toggle("menu-open");
  syncMenuState();
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (navbar?.classList.contains("menu-open")) {
      closeMenu();
    }
  });
});

let isScrollTicking = false;

window.addEventListener(
  "scroll",
  () => {
    if (isScrollTicking) return;

    isScrollTicking = true;
    window.requestAnimationFrame(() => {
      updateNavbarState();
      isScrollTicking = false;
    });
  },
  { passive: true }
);
window.addEventListener("resize", () => {
  if (window.innerWidth > 860) {
    closeMenu();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navbar?.classList.contains("menu-open")) {
    closeMenu();
  }
});

const initRevealObserver = () => {
  revealItems.forEach((item) => {
    item.style.setProperty("--delay", `${item.dataset.delay || 0}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const attachPageTransitions = () => {
  const links = document.querySelectorAll("a[href]");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const rawHref = link.getAttribute("href");

      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:") ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const url = new URL(rawHref, window.location.href);

      if (url.origin !== window.location.origin) return;
      if (!url.pathname.endsWith(".html")) return;

      event.preventDefault();
      closeMenu();
      body.classList.add("is-leaving");

      window.setTimeout(() => {
        window.location.href = url.href;
      }, prefersReducedMotion ? 0 : 220);
    });
  });
};

const initTestimonialsCarousel = () => {
  const track = document.querySelector(".testimonial-track");
  const dotsContainer = document.querySelector(".carousel-dots");
  const wrapper = document.querySelector(".testimonial-wrapper");
  const prevButton = document.querySelector(".testimonial-prev");
  const nextButton = document.querySelector(".testimonial-next");
  const originalSlides = Array.from(
    track?.querySelectorAll(".testimonial-slide") || []
  );

  if (!track || !dotsContainer || !wrapper || !originalSlides.length) {
    return;
  }

  let dots = [];
  let currentIndex = 0;
  let slidesPerView = 3;
  let autoScroll = 0;
  let resizeTimer = 0;

  const getSlidesPerView = () => {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 992) return 2;
    return 3;
  };

  const cloneSlide = (slide) => {
    const clone = slide.cloneNode(true);
    clone.dataset.clone = "true";
    clone.setAttribute("aria-hidden", "true");
    return clone;
  };

  const updateDots = () => {
    const normalizedIndex =
      ((currentIndex % originalSlides.length) + originalSlides.length) %
      originalSlides.length;

    dots.forEach((dot) => dot.classList.remove("active"));
    if (dots[normalizedIndex]) {
      dots[normalizedIndex].classList.add("active");
    }
  };

  const setTrackPosition = (index, animated = true) => {
    const firstSlide = track.querySelector(".testimonial-slide");

    if (!firstSlide) {
      return;
    }

    const trackStyles = window.getComputedStyle(track);
    const gap =
      Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;
    const step = firstSlide.getBoundingClientRect().width + gap;
    const translateX = (index + slidesPerView) * step;

    track.style.transition =
      animated && !prefersReducedMotion ? "transform 0.8s ease" : "none";
    track.style.transform = `translate3d(${-translateX}px, 0, 0)`;
  };

  const goToIndex = (index, animated = true) => {
    currentIndex = index;
    setTrackPosition(currentIndex, animated);
    updateDots();
  };

  const buildDots = () => {
    dotsContainer.innerHTML = "";

    originalSlides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot testimonial-dot";
      dot.setAttribute("aria-label", `Go to testimonial slide ${index + 1}`);
      dotsContainer.appendChild(dot);
    });

    dots = Array.from(dotsContainer.querySelectorAll(".testimonial-dot"));
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        goToIndex(index, true);
        restartAutoScroll();
      });
    });

    updateDots();
  };

  const refreshTrack = () => {
    slidesPerView = getSlidesPerView();
    wrapper.style.setProperty("--slides-per-view", String(slidesPerView));

    track
      .querySelectorAll('[data-clone="true"]')
      .forEach((slide) => slide.remove());

    originalSlides
      .slice(-slidesPerView)
      .map(cloneSlide)
      .forEach((clone) => {
        track.insertBefore(clone, track.firstChild);
      });

    originalSlides
      .slice(0, slidesPerView)
      .map(cloneSlide)
      .forEach((clone) => {
        track.appendChild(clone);
      });

    buildDots();

    window.requestAnimationFrame(() => {
      setTrackPosition(currentIndex, false);
      if (!prefersReducedMotion) {
        track.style.transition = "transform 0.8s ease";
      }
    });
  };

  const nextSlide = () => {
    goToIndex(currentIndex + 1, true);
  };

  const prevSlide = () => {
    goToIndex(currentIndex - 1, true);
  };

  const stopAutoScroll = () => {
    window.clearInterval(autoScroll);
  };

  const startAutoScroll = () => {
    stopAutoScroll();

    if (prefersReducedMotion || originalSlides.length <= slidesPerView) {
      return;
    }

    autoScroll = window.setInterval(nextSlide, 3600);
  };

  const restartAutoScroll = () => {
    stopAutoScroll();
    startAutoScroll();
  };

  const handleLoopReset = (event) => {
    if (event.target !== track) {
      return;
    }

    if (currentIndex >= originalSlides.length) {
      currentIndex = 0;
      setTrackPosition(currentIndex, false);
    } else if (currentIndex < 0) {
      currentIndex = originalSlides.length - 1;
      setTrackPosition(currentIndex, false);
    }

    updateDots();
  };

  track.addEventListener("transitionend", handleLoopReset);
  wrapper.addEventListener("mouseenter", stopAutoScroll);
  wrapper.addEventListener("mouseleave", startAutoScroll);
  wrapper.addEventListener("focusin", stopAutoScroll);
  wrapper.addEventListener("focusout", startAutoScroll);

  nextButton?.addEventListener("click", () => {
    nextSlide();
    restartAutoScroll();
  });

  prevButton?.addEventListener("click", () => {
    prevSlide();
    restartAutoScroll();
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const previousSlidesPerView = slidesPerView;
      const nextSlidesPerView = getSlidesPerView();

      currentIndex =
        ((currentIndex % originalSlides.length) + originalSlides.length) %
        originalSlides.length;

      if (previousSlidesPerView !== nextSlidesPerView) {
        refreshTrack();
      } else {
        setTrackPosition(currentIndex, false);
      }
    }, 120);
  });

  refreshTrack();
  startAutoScroll();
};

const initProjectGallery = () => {
  const galleries = document.querySelectorAll("[data-project-gallery]");

  galleries.forEach((gallery) => {
    const buttons = gallery.querySelectorAll("[data-filter]");
    const cards = gallery.querySelectorAll("[data-project-card]");

    if (!buttons.length || !cards.length) return;

    const applyFilter = (filterValue) => {
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.filter === filterValue);
      });

      let visibleIndex = 0;

      cards.forEach((card) => {
        card.classList.remove("is-filter-visible");

        const matches =
          filterValue === "all" || card.dataset.category === filterValue;

        card.hidden = !matches;

        if (matches) {
          card.style.setProperty("--filter-delay", `${visibleIndex * 55}ms`);
          visibleIndex += 1;
        }
      });

      window.requestAnimationFrame(() => {
        cards.forEach((card) => {
          if (!card.hidden) {
            card.classList.add("is-filter-visible");
          }
        });
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        applyFilter(button.dataset.filter || "all");
      });
    });

    applyFilter("all");
  });
};

const initMahagunPageLightbox = () => {
  const gallery = document.querySelector("[data-mahagun-page-gallery]");
  const galleryImagesSource = document.querySelector("[data-mahagun-gallery-images]");
  const lightbox = document.querySelector("[data-mahagun-page-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-mahagun-page-lightbox-image]");
  const closeButton = lightbox?.querySelector("[data-close-mahagun-page-lightbox]");

  if (!gallery || !lightbox || !lightboxImage || !closeButton) {
    return;
  }

  if (galleryImagesSource) {
    try {
      const images = JSON.parse(galleryImagesSource.textContent || "[]");
      const fragment = document.createDocumentFragment();

      images.forEach((image, index) => {
        if (!image.src) return;

        const item = document.createElement("button");
        const img = document.createElement("img");
        const alt =
          image.alt ||
          `Mahagun Mascot Crossing Republic interior detail ${index + 1}`;

        item.className = "mahagun-gallery-item";
        item.type = "button";
        item.dataset.mahagunPagePreviewSrc = image.src;
        item.dataset.mahagunPagePreviewAlt = alt;

        img.src = image.src;
        img.alt = alt;
        img.loading = "lazy";
        img.decoding = "async";

        item.appendChild(img);
        fragment.appendChild(item);
      });

      gallery.replaceChildren(fragment);
    } catch (error) {
      console.error("Unable to load Mahagun gallery images", error);
    }
  }

  const items = gallery.querySelectorAll("[data-mahagun-page-preview-src]");

  if (!items.length) {
    return;
  }

  const openLightbox = (source, description) => {
    lightboxImage.setAttribute("src", source);
    lightboxImage.setAttribute(
      "alt",
      description || "Mahagun Mascot Crossing Republic interior image"
    );
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.setAttribute("src", "");
    lightboxImage.setAttribute("alt", "");
    body.classList.remove("modal-open");
  };

  items.forEach((item) => {
    item.addEventListener("click", () => {
      openLightbox(item.dataset.mahagunPagePreviewSrc, item.dataset.mahagunPagePreviewAlt);
    });
  });

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
};

const initContactForms = () => {
  const forms = document.querySelectorAll("[data-contact-form]");

  forms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    const statusNode = form.querySelector("[data-form-status]");
    const defaultLabel = submitButton?.textContent;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      form.reset();

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enquiry Sent";
      }

      if (statusNode) {
        statusNode.hidden = false;
      }

      window.setTimeout(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = defaultLabel;
        }
      }, 1600);
    });
  });
};

yearNodes.forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const markPageReady = () => {
  updateNavbarState();
  body.classList.add("is-loaded");
};

attachPageTransitions();
initRevealObserver();
initProjectGallery();
initMahagunPageLightbox();
initContactForms();
updateNavbarState();
syncMenuState();

window.requestAnimationFrame(markPageReady);

window.addEventListener("load", () => {
  markPageReady();
});

window.addEventListener("pageshow", () => {
  body.classList.remove("is-leaving");
  markPageReady();
});
