const { app, nativeImage } = require('electron')
const { join } = require('node:path')

app.whenReady().then(() => {
  const root = join(__dirname, '..')
  const image = nativeImage.createFromPath(join(root, 'assets', 'icon.png'))
  if (image.isEmpty()) throw new Error('assets/icon.png 不是可用的应用图标')
  const size = image.getSize()
  if (size.width !== size.height || size.width < 256) {
    throw new Error(`应用图标必须是至少 256px 的方形图片，当前为 ${size.width}×${size.height}`)
  }
  console.log(`A2Switch icon OK: ${size.width}×${size.height}`)
  app.quit()
}).catch((error) => {
  console.error(error)
  app.exit(1)
})
