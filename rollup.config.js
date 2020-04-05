import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default [{
	input: 'src/draw-space.js',
	output: {
		file: './draw-space.js',
		format: 'cjs',
		sourcemap: false
	},
  plugins: [
    // json(),
    // resolve(),
    // commonjs()
  ]
}]