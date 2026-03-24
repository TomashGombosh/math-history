<template>
  <div
    v-if="modelValue && currentImage"
    class="lightbox-overlay"
    @click.self="close"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="lightbox-content">
      <button class="lightbox-close" @click.stop="close">×</button>

      <button class="lightbox-nav lightbox-nav--prev" @click.stop="prev">
        ‹
      </button>

      <div class="lightbox-image-wrapper">
        <picture v-if="currentImage.url">
          <source :srcset="getWebpUrl(currentImage.url)" type="image/webp" />
          <img
            :src="getOriginalUrl(currentImage.url)"
            :alt="
              currentImage.caption ||
              `Фото випуску – ${currentImage.specialty || ''}`
            "
            class="lightbox-image"
          />
        </picture>

        <div v-if="currentImage.caption" class="lightbox-caption">
          {{ currentImage.caption }}
        </div>
      </div>

      <button class="lightbox-nav lightbox-nav--next" @click.stop="next">
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  images: {
    type: Array,
    default: () => [],
  },
  startIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:modelValue"]);

const index = ref(0);
const prevBodyOverflow = ref("");

const currentImage = computed(() => {
  if (!props.images || !props.images.length) return null;
  return props.images[index.value] || null;
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      const maxIndex = props.images.length > 0 ? props.images.length - 1 : 0;
      index.value = Math.min(Math.max(props.startIndex, 0), maxIndex);

      if (typeof window !== "undefined" && document?.body) {
        prevBodyOverflow.value = document.body.style.overflow || "";
        document.body.style.overflow = "hidden";
      }
    } else {
      if (typeof window !== "undefined" && document?.body) {
        document.body.style.overflow = prevBodyOverflow.value || "";
      }
    }
  }
);

onUnmounted(() => {
  if (typeof window !== "undefined" && document?.body) {
    document.body.style.overflow = prevBodyOverflow.value || "";
  }
});

function close() {
  emit("update:modelValue", false);
}

function next() {
  if (!props.images.length) return;
  index.value = (index.value + 1) % props.images.length;
}

function prev() {
  if (!props.images.length) return;
  index.value = (index.value - 1 + props.images.length) % props.images.length;
}

function getOriginalUrl(url) {
  return url || "";
}

function getWebpUrl(url) {
  if (!url) return "";
  return url
    .replace("/images/", "/images-webp/")
    .replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

const touchStartX = ref(null);

function onTouchStart(e) {
  if (!e.changedTouches || !e.changedTouches.length) return;
  touchStartX.value = e.changedTouches[0].clientX;
}

function onTouchEnd(e) {
  if (!touchStartX.value || !e.changedTouches || !e.changedTouches.length)
    return;

  const endX = e.changedTouches[0].clientX;
  const dx = endX - touchStartX.value;

  const threshold = 50;

  if (dx > threshold) {
    prev();
  } else if (dx < -threshold) {
    next();
  }

  touchStartX.value = null;
}
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: lightbox-zoom-in 0.2s ease-out;
}

@keyframes lightbox-zoom-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.lightbox-image-wrapper {
  max-width: 100%;
  max-height: 100%;
  text-align: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  margin: 0 auto;
}

.lightbox-caption {
  margin-top: 8px;
  color: #f0f0f0;
  font-size: 14px;
}

.lightbox-close {
  position: absolute;
  top: -8px;
  right: -8px;
  border: none;
  background: #ffffff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.lightbox-nav {
  border: none;
  background: rgba(255, 255, 255, 0.9);
  width: 32px;
  height: 60px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-nav--prev {
  border-radius: 30px 0 0 30px;
}

.lightbox-nav--next {
  border-radius: 0 30px 30px 0;
}
</style>
