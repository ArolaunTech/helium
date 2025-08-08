class RendererWebGL {
	program = null;

	constructor(canvas) {
		this.canvas = canvas;
		this.gl = this.canvas.getContext("webgl2");

		if (!this.gl) {
			console.warn("WebGL2 context could not be initialized");
			return;
		}

		
	}

	compileShader(type, source) {
		let shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
 
		console.warn(this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
	}

	createProgram(vertexSource, fragmentSource) {
		let vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
		let fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

		let program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		if (success) {
			return program;
		}

		console.warn(this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);

		return null;
	}

	loadAndCompileShaders() {
		Promise.all([
			fetch("../glsl/sprite.vert", {mode: "same-origin"}),
			fetch("../glsl/sprite.frag", {mode: "same-origin"})
		])
		.then((responses) => Promise.all([responses[0].text(), responses[1].text()]))
		.then((sources) => {
			let program = this.createProgram(sources[0], sources[1]);

			if (program === null) {
				console.error("Unable to create shader program.");
				return;
			}

			this.program = program;
		});
	}

	loadIR(ir) {
		console.log(ir);

		for (let i = 0; i < ir.sprites.length; i++) {
			console.log(ir.sprites[i]);

			for (let j = 0; j < ir.sprites[i].costumes.length; j++) {
				console.log(ir.sprites[i].costumes[j]);
			}
		}
	}
}

var globalRenderer = new RendererWebGL(document.getElementById("window"));
globalRenderer.loadAndCompileShaders();