<script setup lang="ts">
defineProps<{ name: 'edit' | 'delete' | 'plus' }>()

const paths = {
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  delete: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
}
</script>

<template>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
