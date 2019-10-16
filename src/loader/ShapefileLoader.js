

export class ShapefileLoader{

	constructor(){
		this.transform = null;
	}

	async load(path){
		const features = await this.loadShapefileFeatures(path);
		const node = new THREE.Object3D();
		
		for(const feature of features){
			const fnode = this.featureToSceneNode(feature);
			node.add(fnode);
		}

		const result = {
			features: features,
			node: node,
		};

		return result;
	}

	featureToSceneNode(feature){
		let geometry = feature.geometry;
		
		let color = new THREE.Color(1, 1, 1);

		let transform = this.transform;
		if(transform === null){
			transform = {forward: (v) => v};
		}
		
		if(feature.geometry.type === "Point"){
			let sg = new THREE.SphereGeometry(1, 18, 18);
			let sm = new THREE.MeshNormalMaterial();
			let s = new THREE.Mesh(sg, sm);
			
			let [long, lat] = geometry.coordinates;
			let pos = transform.forward([long, lat]);
			
			s.position.set(...pos, 20);
			
			s.scale.set(10, 10, 10);
			
			return s;
		}else if(geometry.type === "LineString"){
			let coordinates = [];
			
			let min = new THREE.Vector3(Infinity, Infinity, Infinity);
			for(let i = 0; i < geometry.coordinates.length; i++){
				let [long, lat] = geometry.coordinates[i];
				let pos = transform.forward([long, lat]);
				
				min.x = Math.min(min.x, pos[0]);
				min.y = Math.min(min.y, pos[1]);
				min.z = Math.min(min.z, 20);
				
				coordinates.push(...pos, 20);
				if(i > 0 && i < geometry.coordinates.length - 1){
					coordinates.push(...pos, 20);
				}
			}
			
			for(let i = 0; i < coordinates.length; i += 3){
				coordinates[i+0] -= min.x;
				coordinates[i+1] -= min.y;
				coordinates[i+2] -= min.z;
			}
			
			let positions = new Float32Array(coordinates);
			
			let lineGeometry = new THREE.BufferGeometry();
			lineGeometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
			
			let material = new THREE.LineBasicMaterial( { color: color} );
			let line = new THREE.LineSegments(lineGeometry, material);
			line.position.copy(min);
			
			return line;
		}else if(geometry.type === "Polygon"){
			for(let pc of geometry.coordinates){
				let coordinates = [];
				
				let min = new THREE.Vector3(Infinity, Infinity, Infinity);
				for(let i = 0; i < pc.length; i++){
					let [long, lat] = pc[i];
					let pos = transform.forward([long, lat]);
					
					min.x = Math.min(min.x, pos[0]);
					min.y = Math.min(min.y, pos[1]);
					min.z = Math.min(min.z, 20);
					
					coordinates.push(...pos, 20);
					if(i > 0 && i < pc.length - 1){
						coordinates.push(...pos, 20);
					}
				}
				
				for(let i = 0; i < coordinates.length; i += 3){
					coordinates[i+0] -= min.x;
					coordinates[i+1] -= min.y;
					coordinates[i+2] -= min.z;
				}
				
				let positions = new Float32Array(coordinates);
				
				let lineGeometry = new THREE.BufferGeometry();
				lineGeometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
				
				let material = new THREE.LineBasicMaterial( { color: color} );
				let line = new THREE.LineSegments(lineGeometry, material);
				line.position.copy(min);
				
				return line;
			}
		}else{
			console.log("unhandled feature: ", feature);
		}
	}

	async loadShapefileFeatures(file){
		let features = [];

		let source = await shapefile.open(file);

		while(true){
			let result = await source.read();

			if (result.done) {
				break;
			}

			if (result.value && result.value.type === 'Feature' && result.value.geometry !== undefined) {
				features.push(result.value);
			}
		}

		return features;
	}

};

