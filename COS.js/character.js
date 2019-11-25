import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';
import { BVHLoader } from './three.js/BVHLoader.js';

var Character=( function(){
	function Character(name,position,career,camp){
		var trunk= new THREE.Group();
		// set parameter from call function
		trunk.name=name
		trunk.position.copy(position)
		trunk.position.d=position.d
		trunk.position.d=trunk.position.d%4
		if(trunk.position.d<0){trunk.position.d+=4}
		trunk.career=career
		trunk.camp=camp
		trunk.running=false 
		// set default parameter from document
		var fs=require('fs') 
		var careerData=JSON.parse(fs.readFileSync('./career/'+trunk.career+'.json'))
		trunk.species=careerData.species
		trunk.health=careerData.health
		trunk.maxStamina=careerData.stamina
		trunk.stamina=careerData.stamina
		trunk.weight=careerData.weight
		trunk.signs=careerData.signs

		// show file in directory 
		// fs.readdir("./career/",function(err,files){console.log(files)})


		// load skeleton
		new BVHLoader()
			.setPath( './actis/male/' )
			.load( "male_base.bvh", function ( result ) {
				trunk.skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
				trunk.skeletonHelper.skeleton = result.skeleton; 
				trunk.mixer = new THREE.AnimationMixer( trunk.skeletonHelper );
				trunk.scale.set(.25,.25,.25)
				trunk.add( result.skeleton.bones[ 0 ] );
				trunk.rotateY( Math.PI/2*trunk.position.d)
				trunk.rotateX(-Math.PI/2)
			} );

		// bones bind trunk -------------------
		var BoneNames=['10','20','30','41','42','43','51','52','53','61','62','63','71','72','73']

		BoneNames.forEach(function(part){
			// bindBone(part)
			new MTLLoader()
				.setPath( './dolls/'+career+'/' )
				.load( trunk.species+'-'+part+'.mtl', function ( materials ) {
					materials.preload();
					new OBJLoader()
						.setMaterials( materials )
						.setPath( './dolls/'+career+'/' )
						.load( trunk.species+'-'+part+'.obj', function ( object ) {
							object.rotateX(Math.PI/2)
							trunk.getObjectByName('Bone-'+part).add(object);
						});
				});
		})


		// build MarkSpace and Marks ------------------------------
		trunk.markSpace=new THREE.Group()
		trunk.markSpace.name='markspace'

		var geometry = new THREE.SphereGeometry( .08, 8, 8);
		var material = new THREE.MeshLambertMaterial( {color: 0x0000ff} );
		var sphere = new THREE.Mesh( geometry, material );
		sphere.position.set(-.4,1.08,.4)
		sphere.material.transparent=true
		sphere.material.opacity=1
		trunk.markSpace.add( sphere );
		trunk.markSpace.staminaBall=sphere

		trunk.showMarks=function(){
			this.markSpace.visible=true
			this.markSpace.position.copy(this.position)
			// plot blood stick
			this.markSpace.remove(trunk.markSpace.blood)
			var rest=this.health/10
			if(rest==0){rest=0.001}
			var geometry = new THREE.BoxGeometry(.05,rest,.05);
			var bloodcolor=0x00ffff
			if(this.health<8){bloodcolor=0x00ff00}
			if(this.health<5){bloodcolor=0xffff00}
			if(this.health<3){bloodcolor=0xff0000}
			var material = new THREE.MeshLambertMaterial( {color: bloodcolor} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(-.4,1-rest/2,.4)
			// cube.position.set(-.4,this.health/20,.4)
			this.markSpace.blood=cube
			this.markSpace.add(cube);

			// plot black no blood stick
			this.markSpace.remove(trunk.markSpace.noblood)
			var lost=1-this.health/10
			if(lost==0){lost=0.001}
			var geometry = new THREE.BoxGeometry(.05,lost,.05);
			var material = new THREE.MeshLambertMaterial( {color: 0x000000} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(-.4,lost/2,.4)
			cube.material.transparent=true
			cube.material.opacity=.5
			this.markSpace.noblood=cube
			this.markSpace.add(cube);

			//set stamina ball transparent
			if(this.markSpace.staminaBall!=undefined){
				if(this.stamina>0){
					this.markSpace.staminaBall.material.opacity=1
				}else{
					this.markSpace.staminaBall.material.opacity=.5
				}
			}
		}

		trunk.hideMarks=function(){
			this.markSpace.visible=false
		}
		// add selector to markSpace -------------
		new OBJLoader()
			.setPath( './goods/' )
			.load('charSele.obj', function ( selector ) {
				selector.children[0].material.color.set(0xff0000)
				selector.visible=false
				selector.rotateX(Math.PI/2)
				trunk.add(selector);
				trunk.selector=selector
			});
		trunk.showSeletor=function(color){
			this.selector.visible=true
			this.selector.children[0].material.color.set(color)
		}  
		trunk.hideSeletor=function(color){
			this.selector.visible=false
		}


		// add character camp signs ----------
		var campcolor=0xffffff
		if(trunk.camp=="R"){campcolor=0xff0000}
		if(trunk.camp=="G"){campcolor=0x00ff00}
		if(trunk.camp=="B"){campcolor=0x0000ff}
		if(trunk.camp=="W"){campcolor=0xffffff}
		if(trunk.camp=="M"){campcolor=0xff00ff}
		if(trunk.camp=="Y"){campcolor=0xffff00}
		if(trunk.camp=="C"){campcolor=0x00ffff}
		if(trunk.camp=="K"){campcolor=0x000000}
		// on head
		new OBJLoader()
			.setPath( './dolls/signs/' )
			.load(trunk.signs[0]+'.obj', function ( object ) {
				object.children[0].material.color.set(campcolor)
				object.rotateX(Math.PI/2)
				trunk.getObjectByName('Bone-30').add(object);
			});
		// on shoulder
		new OBJLoader()
			.setPath( './dolls/signs/' )
			.load( trunk.signs[1]+'.obj', function ( object ) {
				object.children[0].material.color.set(campcolor)
				object.rotateX(Math.PI/2)
				trunk.getObjectByName('Bone-10').add(object);
			});
				
		// moves ------------------
		trunk.move=function(name){
			var alter=this
			alter.position.d=alter.position.d%4
			if(alter.position.d<0){alter.position.d+=4}
			switch(name){
				case "walk":
					if(alter.position.d==0){alter.position.z+=1}
					if(alter.position.d==1){alter.position.x+=1}
					if(alter.position.d==2){alter.position.z-=1}
					if(alter.position.d==3){alter.position.x-=1}
					break;
				case "turnRigh":
					alter.rotateZ(-Math.PI/2)
					alter.position.d-=1
					break;
				case "turnLeft":
					alter.rotateZ(Math.PI/2)
					alter.position.d+=1
					break;
			}
			alter.position.d=alter.position.d%4
			if(alter.position.d<0){alter.position.d+=4}
		}

		// actions ------------
		var actionNames=['base','sway','beaten','walk','hack','sits','turnLeft','turnRigh','swep','spur','salute','dead']

		trunk.defaultAction="base"

		trunk.actions=[]
		actionNames.forEach(function(name){
			new BVHLoader()
				.setPath( './actis/male/' )
				.load( 'male_'+name+'.bvh', function ( result ) {
					trunk.mixer.clipAction( result.clip ).name=name	
					trunk.actions[name]=trunk.mixer.clipAction( result.clip )
					if(name==trunk.defaultAction){
						trunk.mixer.clipAction( result.clip ).setEffectiveWeight(1).play()
						trunk.doing=trunk.defaultAction
					}
				} );
			}
		)

		trunk.todo=function(name,keep){
			var alter=this
			alter.actions[alter.doing].setEffectiveWeight(0).play()
			alter.actions[name].setEffectiveWeight(0).reset()
			alter.actions[name].setEffectiveWeight(1).play()
			alter.doing=name
			if(alter.health>=0){alter.showMarks()}

			if(name!=alter.defaultAction){
				alter.running=true
				setTimeout(function(){
					alter.todo(alter.defaultAction)
					alter.running=false
					// if character died
					if(alter.health<=0){
						alter.todo('dead')
						alter.running=true
						// play dead after beaten
						setTimeout(function(){
							alter.actions['dead'].paused=true
							alter.markSpace.visible=false
							alter.visible=false
						},1000)
					}
				},1000)
			}
		}
		//   feedback present states
		trunk.getStates=function(){
			var states=this.name+':'
			if(this.position.x<10){states+=0}
				states+=this.position.x+','
			if(this.position.y<10){states+=0}
				states+=this.position.y+','
			if(this.position.z<10){states+=0}
				states+=this.position.z+','
			if(this.position.d<10){states+=0}
				states+=this.position.d+','
			if(this.health<10){states+=0}
				states+=this.health
			states+='|'
			// console.log(0+this.position.x.toString())
			return states
		}

		//  cast skills ---------------------

		trunk.cast=function(skillname){
			var alter=this
			var relative
			var absolute=[]
			
			careerData.skills.forEach(function(ss){
				if(ss.name==skillname){
					relative=ss.operator
					// console.log(ss.operator[0].position)
				}			
			})

			alter.position.d=alter.position.d%4
			if(alter.position.d<0){alter.position.d+=4}
			if(!relative){return}
			relative.forEach(function(oper){
				// console.log(oper)
				var cos=1,sin=0
				if(alter.position.d==1){cos= 0,sin= 1}
				if(alter.position.d==2){cos=-1,sin= 0}
				if(alter.position.d==3){cos= 0,sin=-1}
				// deep copy
				var oper1={position:{x: 0,y:0,z: 0,d:0},damage:oper.damage}
				oper1.position.x=oper.position.z*sin+oper.position.x*cos+alter.position.x
				oper1.position.y=oper.position.y+alter.position.y
				oper1.position.z=oper.position.z*cos-oper.position.x*sin+alter.position.z
				oper1.position.d=oper.position.d+alter.position.d
				absolute.push(oper1)
			})
			// console.log(absolute)
			return absolute		
		}

		// effects ---------------------------

		var effectNames=['hack','swep','spur']

		trunk.effects=[]
		effectNames.forEach(function(name){
			new MTLLoader()
				.setPath( './effects/' )
				.load( 'hack.mtl', function ( materials ) {
					materials.preload();
					new OBJLoader()
						.setMaterials( materials )
						.setPath( './effects/' )
						.load( name+'.obj', function ( object ) {
							object.rotateX(Math.PI/2)
							object.visible=false
							trunk.effects[name]=object
							trunk.add(object);
						});

				});
		})

		trunk.show=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			setTimeout(function(){
				// console.log(alter.effects[name])
				alter.effects[name].visible=true
			},delay*1000)
		}
		trunk.hide=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			setTimeout(function(){
				alter.effects[name].visible=false
			},delay*1000)
		}		

		// gears ----------------------------
		trunk.gears=[]
		careerData.gears.forEach(function(gear){
			new MTLLoader()
				.setPath( './gears/' )
				.load( gear[0]+'.mtl', function ( materials ) {
				// .load( 'dagaxe.mtl', function ( materials ) {
					materials.preload();
					new OBJLoader()
						.setMaterials( materials )
						.setPath( './gears/' )
						.load( gear[0]+'.obj', function ( object ) {
						// .load( 'dagaxe.obj', function ( object ) {
							object.rotateX(Math.PI/2)
							trunk.gears[gear[0]]=object
							trunk.getObjectByName('Bone-'+gear[1]).add(object);
						});
				});
		})
		
		trunk.take=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			setTimeout(function(){
				alter.gears[name].visible=true
			},delay*1000)
		}
		trunk.puts=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			setTimeout(function(){
				alter.gears[name].visible=false
			},delay*1000)
		}	

		// character commands-------------------------
		trunk.doSingleCommand=function(command,callback){
			var alter=this
			var operators
			// if(alter.running){return}
				careerData.orders.forEach(function(ord){
					if(ord.key==command){
						alter.stamina-=ord.consume
						alter.move(ord.action)             
						alter.todo(ord.action)
						operators=alter.cast(ord.action)
					}
				})
			return operators
		}
		return trunk
	}
	return Character;
})();
export { Character };
