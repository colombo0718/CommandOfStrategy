import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';
import { BVHLoader } from './three.js/BVHLoader.js';

var Character=( function(){
	// console.log(Group)
	function Character(name,position,career){
		var trunk= new THREE.Group(); 
		trunk.name=name
		trunk.position.set(position.x,position.y,position.z)
		trunk.direction=position.d
		trunk.career=career
		trunk.control=false	

		new BVHLoader()
			.setPath( './actis/' )
			.load( "male_sway.bvh", function ( result ) {
				// ra=result
				// console.log(result )
				trunk.skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
				trunk.skeletonHelper.skeleton = result.skeleton; 
				trunk.mixer = new THREE.AnimationMixer( trunk.skeletonHelper );
				// console.log(trunk.mixer)
				trunk.scale.set(.25,.25,.25)
				trunk.add( result.skeleton.bones[ 0 ] );
				trunk.rotateY( Math.PI/2*position.d%4)
				trunk.rotateX(-Math.PI/2)
				// scene.add( skeletonHelper );
				// scene.add( this );
				// console.log(trunk.mixer)
				// console.log(trunk.mixer.clipAction( result.clip ).setEffectiveWeight(1).play().setLoop( THREE.LoopOnce ));
				// console.log(trunk.mixer.clipAction( result.clip ))
				// console.log(trunk.mixer)
				// trunk.mixer.addEventListener( 'loop', function( e ) {console.log(e.action.paused=true)} )
				trunk.doing='sway'
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

		// moves ------------------
		trunk.move=function(name,delay){
			var alter=this
			if(!delay){delay=0}
			alter.direction=alter.direction%4
			if(alter.direction<0){alter.direction+=4}
			setTimeout(function(){
				switch(name){
					case "forward":
						// console.log(this)
						if(alter.direction==0){alter.position.z+=1}
						if(alter.direction==1){alter.position.x+=1}
						if(alter.direction==2){alter.position.z-=1}
						if(alter.direction==3){alter.position.x-=1}
						break;
					case "turn right":
						alter.rotateZ(-Math.PI/2)
						alter.direction-=1
						alter.direction=alter.direction%4
						break;
					case "turn left":
						alter.rotateZ(Math.PI/2)
						alter.direction+=1
						alter.direction=alter.direction%4
						break;
				}
			},delay*1000)
		}

		// actions ------------
		var actionNames=['base','sway','walk','hack','sits','tlef','trig','swep','spur','salute']

		trunk.actions=[]
		actionNames.forEach(function(name){
			new BVHLoader()
				.setPath( './actis/' )
				.load( 'male_'+name+'.bvh', function ( result ) {
					trunk.mixer.clipAction( result.clip ).name=name	
					trunk.actions[name]=trunk.mixer.clipAction( result.clip )
				} );
			}
		)

		trunk.todo=function(name,keep){
			var alter=this
			alter.actions[alter.doing].setEffectiveWeight(0).play()
			if(name!='sway'){alter.actions[name].setEffectiveWeight(0).reset()}
			alter.actions[name].setEffectiveWeight(1).play()
			alter.doing=name
			
			if(keep && keep!=0){
				alter.control=true
				setTimeout(function(){
					alter.control=false
				},keep*1000)
			}
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
		var gearNames=['sward-right','sward-left']
		var gearBinds=['53','43']
		trunk.gears=[]
		new MTLLoader()
			.setPath( './gears/' )
			.load( 'sward-right.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './gears/' )
					.load( 'sward-right.obj', function ( object ) {
						object.rotateX(Math.PI/2)
						trunk.gears['sward-right']=object
						trunk.getObjectByName('Bone-53').add(object);
					});

			});
		new MTLLoader()
			.setPath( './gears/' )
			.load( 'sward-left.mtl', function ( materials ) {
				materials.preload();
				new OBJLoader()
					.setMaterials( materials )
					.setPath( './gears/' )
					.load( 'sward-left.obj', function ( object ) {
						object.rotateX(Math.PI/2)
						trunk.gears['sward-left']=object
						trunk.gears['sward-left'].visible=false
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
		trunk.doSingleCommand=function(command,delay){
			var alter=this
			if(alter.control){return}
			if(!delay){delay=0}
			setTimeout(function(){
				if(command=='w' ){               
					alter.todo('walk',1)
					alter.move('forward',1)
				}
				if(command=='s'){
					alter.todo('salute',1)
					alter.puts('sward-right')
					alter.take('sward-left')
					alter.take('sward-right',1)
					alter.puts('sward-left',1)
				}
				if(command=='d'){
					alter.todo('trig',1)
					alter.move('turn right',1)
				}
				if(command=='a'){
					alter.todo('tlef',1)
					alter.move('turn left',1)
				}
				if(command=='x'){
					alter.todo('hack',1)
					alter.show('hack',.3)
					alter.hide('hack',1)
				}
				if(command=='c'){
					alter.todo('swep',1)
					alter.show('swep',.3)
					alter.hide('swep',1)
				}
				if(command=='z'){
					alter.todo('spur',1)
					alter.show('spur',.3)
					alter.hide('spur',1)
				}
			},delay*1000)
		}
		// ------------------------------
		/* [ index.html ]
			function onKeyPress(event){
				peoples.forEach(function(element) {
					if(element.name!="a"){                        
						element.doSingleCommand(event.key)
					}
				});
			}
		*/
		return trunk
	}
	return Character;
})();
export { Character };
