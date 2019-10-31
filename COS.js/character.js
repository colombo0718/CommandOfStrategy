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
		trunk.direction=position.d
		trunk.position.d=position.d
		trunk.career=career
		trunk.camp=camp
		trunk.control=false 
		// set default parameter from document
		var fs=require('fs') 
		var data=JSON.parse(fs.readFileSync('./career/'+trunk.career+'.json'))
		trunk.health=data.health
		trunk.stamina=data.stamina
		trunk.weight=data.weight
		trunk.signs=data.signs
		// show file in directory 
		fs.readdir("./career/",function(err,files){console.log(files)})


		// load skeleton
		new BVHLoader()
			.setPath( './actis/male/' )
			.load( "male_base.bvh", function ( result ) {
				trunk.skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
				trunk.skeletonHelper.skeleton = result.skeleton; 
				trunk.mixer = new THREE.AnimationMixer( trunk.skeletonHelper );
				trunk.scale.set(.25,.25,.25)
				trunk.add( result.skeleton.bones[ 0 ] );
				trunk.rotateY( Math.PI/2*position.d%4)
				trunk.rotateX(-Math.PI/2)
			} );

		// bones bind trunk -------------------
		var BoneNames=['10','20','30','41','42','43','51','52','53','61','62','63','71','72','73']

		BoneNames.forEach(function(part){
			// bindBone(part)
			new MTLLoader()
				.setPath( './dolls/'+career+'/' )
				.load( 'male-'+part+'.mtl', function ( materials ) {
					materials.preload();
					new OBJLoader()
						.setMaterials( materials )
						.setPath( './dolls/'+career+'/' )
						.load( 'male-'+part+'.obj', function ( object ) {
							object.rotateX(Math.PI/2)
							trunk.getObjectByName('Bone-'+part).add(object);
						});
				});
		})


		// build MarkSpace and Marks
		trunk.markSpace=new THREE.Group()
			// add blood stick
		new MTLLoader()
			.setPath( './goods/' )
			.load( 'walkflag.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './goods/' )
					.load( 'walkflag.obj', function ( object ) {
						// console.log(object.children[0].material.color.set(0x000000))
						object.scale.set(.25,.25,.25)
						object.position.set(-.4,0,.4)
						// object.position.set(0,0,0)
						trunk.markSpace.gflag=object
						trunk.markSpace.add(object);
					});

			});

		new MTLLoader()
			.setPath( './goods/' )
			.load( 'stopflag.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './goods/' )
					.load( 'stopflag.obj', function ( object ) {
						object.scale.set(.25,.25,.25)
						object.position.set(-.4,0,.4)
						object.visible=false
						trunk.markSpace.rflag=object
						trunk.markSpace.add(object);
					});
			});

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
			var material = new THREE.MeshBasicMaterial( {color: bloodcolor} );
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
			var material = new THREE.MeshBasicMaterial( {color: 0x000000} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(-.4,lost/2,.4)
			this.markSpace.noblood=cube
			this.markSpace.add(cube);
			
			//set small flag
			if(this.markSpace.gflag!=undefined && this.markSpace.gflag!=undefined){
				// console.log(this.markSpace.gflag.visible)
				if(this.stamina>0){
					this.markSpace.gflag.visible=true
					this.markSpace.rflag.visible=false
				}else{
					this.markSpace.gflag.visible=false
					this.markSpace.rflag.visible=true
				}
			}
		}

		trunk.hideMarks=function(){
			this.markSpace.visible=false
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
		trunk.move=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			alter.position.d=alter.position.d%4
			if(alter.position.d<0){alter.position.d+=4}
			setTimeout(function(){
				switch(name){
					case "walk":
						// console.log(this)
						if(alter.position.d==0){alter.position.z+=1}
						if(alter.position.d==1){alter.position.x+=1}
						if(alter.position.d==2){alter.position.z-=1}
						if(alter.position.d==3){alter.position.x-=1}
						break;
					case "turnRigh":
						alter.rotateZ(-Math.PI/2)
						alter.position.d-=1
						alter.position.d=alter.position.d%4
						break;
					case "turnLeft":
						alter.rotateZ(Math.PI/2)
						alter.position.d+=1
						alter.position.d=alter.position.d%4
						break;
				}
				// alter.position.d=alter.position.d
			},delay*1000)
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
			// if(name!=alter.defaultAction && alter.stamina<=0){
			// 	return
			// }
			alter.actions[name].setEffectiveWeight(0).reset()
			alter.actions[name].setEffectiveWeight(1).play()
			alter.doing=name
			// alter.hideMarks()
			// alter.stamina-=1
			// console.log(alter.stamina)
			// console.log(alter.position)
			
			if(keep && keep!=0){
				alter.control=true
				setTimeout(function(){
					// alter.showMarks()
					alter.control=false
					alter.todo(alter.defaultAction)
				},keep*1000)
			}

			setTimeout(function(){
				alter.showMarks()
			},keep*1100)
		}
		//  cast skills ---------------------

		trunk.cast=function(skillname){
			var alter=this
			var relative
			var absolute=[]
			
			data.skills.forEach(function(ss){
				if(ss.name==skillname){
					relative=ss.operator
					// console.log(ss.operator[0].position)
				}			
			})

			alter.position.d=alter.position.d%4
			if(alter.position.d<0){alter.position.d+=4}
			relative.forEach(function(oper){
				// console.log(oper)
				var cos=1,sin=0
				if(alter.position.d==1){cos= 0,sin= 1}
				if(alter.position.d==2){cos=-1,sin= 0}
				if(alter.position.d==3){cos= 0,sin=-1}
				// deep copy
				var oper1={position:{x: 0,y:0,z: 0,d:0},damage:1}
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
		var gearNames=['sword-right','sword-left',"dagaxe"]
		var gearBinds=['53','43','53']
		trunk.gears=[]
		new MTLLoader()
			.setPath( './gears/' )
			.load( 'sword-right.mtl', function ( materials ) {
			// .load( 'dagaxe.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './gears/' )
					.load( 'sword-right.obj', function ( object ) {
						// .load( 'dagaxe.obj', function ( object ) {
						object.rotateX(Math.PI/2)
						trunk.gears['sword-right']=object
						trunk.getObjectByName('Bone-53').add(object);
					});

			});
		new MTLLoader()
			.setPath( './gears/' )
			.load( 'sword-left.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './gears/' )
					.load( 'sword-left.obj', function ( object ) {
						object.rotateX(Math.PI/2)
						trunk.gears['sword-left']=object
						trunk.gears['sword-left'].visible=false
						trunk.getObjectByName('Bone-43').add(object);
					});

			});	
		
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
			if(alter.control){return}
			// if(!delay){delay=0}
			// setTimeout(function(){
				if(command=='w' ){               
					alter.todo('walk',1)
					alter.move('walk',1)
				}
				if(command=='s'){
					alter.todo('salute',1)
				}
				if(command=='d'){
					alter.todo('turnRigh',1)
					alter.move('turnRigh',1)
				}
				if(command=='a'){
					alter.todo('turnLeft',1)
					alter.move('turnLeft',1)
				}
				if(command=='x'){
					alter.todo('hack',1)
					alter.show('hack',.3)
					alter.hide('hack',1)
					operators=alter.cast('hack') // !!!!!!!
				}
				if(command=='c'){
					alter.todo('swep',1)
					alter.show('swep',.3)
					alter.hide('swep',1)
					operators=alter.cast('swep') // !!!!!!!
				}
				if(command=='z'){
					alter.todo('spur',1)
					alter.show('spur',.3)
					alter.hide('spur',1)
					operators=alter.cast('spur') // !!!!!!!
				}
			// },delay*1000)
			// callback(operators)
			return operators
		}
		// ------------------------------
		return trunk
	}
	return Character;
})();
export { Character };
