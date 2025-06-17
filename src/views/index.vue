<template>
  <canvas ref="canvasRef" class="mouse-trail-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx, width, height, animationId
let particles = []

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = Math.random() * 5 + 2
    this.alpha = 1
    this.vx = (Math.random() - 0.5) * 1.5
    this.vy = (Math.random() - 0.5) * 1.5
    this.color = `hsl(${Math.random() * 360}, 100%, 70%)`
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.alpha -= 0.01
    this.radius *= 0.98
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = `${this.color.replace('70%', '50%').replace(')', `,${this.alpha})`).replace('hsl', 'hsla')}`
    ctx.fill()
  }

  isAlive() {
    return this.alpha > 0.01 && this.radius > 0.5
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // 渐变清除形成拖尾效果
  ctx.fillRect(0, 0, width, height)

  particles.forEach(p => {
    p.update()
    p.draw()
  })

  particles = particles.filter(p => p.isAlive())
}

const spawnParticle = (x, y) => {
  for (let i = 0; i < 3; i++) {
    particles.push(new Particle(x, y))
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  width = canvas.width = window.innerWidth
  height = canvas.height = window.innerHeight

  animate()

  window.addEventListener('mousemove', e => {
    spawnParticle(e.clientX, e.clientY)
  })

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.mouse-trail-canvas {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  background: black;
}
</style>
