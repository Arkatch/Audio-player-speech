////////////////////////////////////////////////////////////////////
//HTML content
////////////////////////////////////////////////////////////////////
const info = document.querySelector('.output')
const audioDiv = document.getElementsByClassName('ply')[0]
const names = document.getElementById('names')
/********************************/

//////////////////////////////////
// HTML Player elements
//////////////////////////////////
const mainId = document.getElementById('grid-background')
const micId = document.getElementById('mic')
const titleId = document.getElementById('title')
const timeStartId = document.getElementById('timeStart')
const timeBarId = document.getElementById('timeBar')
const timeEndId = document.getElementById('timeEnd')
const backId = document.getElementById('back')
const playId = document.getElementById('play')
const nextId = document.getElementById('next')
const randomId = document.getElementById('random')
const repeatId = document.getElementById('repeat')
const volumeId = document.getElementById('volume')
const volumeMenuId = document.getElementById('volumeCtrl')
const volumeHrId = volumeMenuId.querySelector('hr')
const listBar = document.getElementById('listBar')
const listMusic = document.getElementById('listMusic')
const listDiv = listMusic.getElementsByClassName('output')[0]
let listPlay

//fa fa buttons
const micFa = micId.querySelector('i')
const timeBarFa = timeBarId.querySelector('i')
const backFa = backId.querySelector('i')
const playFa = playId.querySelector('i')
const nextFa = nextId.querySelector('i')
const randomFa = randomId.querySelector('i')
const repeatFa = repeatId.querySelector('i')
const volumeFa = volumeId.querySelector('i')
const volumeIco = volumeMenuId.querySelector('i')
const volumeScroll = volumeMenuId.querySelector('.fa.fa-circle')
const listBarFa = listBar.querySelector('i')
/****************************************************************/


////////////////////////////////////////////////////////////////////
//Web speech API 
////////////////////////////////////////////////////////////////////
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
const words = ['Rozpocznij', 'start', 'stop', 'poprzedni', 'następny', 'losowo', 'powtarzaj', 'lista']
const grammar = '#JSGF V1.0; grammar words; public <word> = ' + words.join(' | ') + ' ;'

const recognition = new SpeechRecognition()
const speechRecognitionList = new SpeechGrammarList()

speechRecognitionList.addFromString(grammar, 1)

recognition.grammars = speechRecognitionList
recognition.lang = 'pl-PL'
recognition.interimResults = false
recognition.maxAlternatives = 1
/********************************/

//////////////////////////////////
//Web speech API control object
//////////////////////////////////
/*
	control.start(){
		-rozpoczyna nagrywanie
		-wykonuje metodę result() - pobieranie słów
		-wykonuje metodę error() - reportowanie błędów
	}
	control.end(){
		-zatrzymuje nagrywanie
	}
	control.result(){
		-wykonuje metodę onresult na obiekcie recognition
		-pobiera powiedziane słowo
		-wykonuje funkcję pick(word) która robi coś w zależności od powiedzianego słowa
		-restartuje nagrywanie
	}
	control.error(){
		-raportuje błędy
		-gdy wykryje brak mowy, to restartuje nagrywanie
		-WAŻNE!!! kaszlnięcia itp. przerywały nagrywanie. Onspeechend pozwala na zrestartowanie nagrywania po takim wydarzeniu
	}
	control.restart(){
		-restartuje nagrywanie
		- let x - zmienna interwału z której po udanym restarcie usuwamy interwał
		- let err = false - zmienna która mówi blokowi finally{} czy wykonało się try, czy catch
		-promise - asynchroniczność  itp
	}
*/
//////////////////////////////////
const control = {
	start:	()=>{
		recognition.start()
		control.result()
		control.error()
	},
	result:	()=>{
		recognition.onresult = (event)=>{
			let word = event.results[0][0].transcript
			pick(word)
			control.restart()
		}
	},
	error:	()=>{
		recognition.onerror = (event)=>{
			if(event.error == 'no-speech')
				control.restart()
			else
				console.log('Błąd control:'+event.error)
		}
		recognition.onspeechend = ()=>{
			control.restart()
		}
	},
	restart:()=>{
		let err = false
		let x = setInterval(()=>{
			try{
				err = false
				recognition.start()	
			}catch(e){
				err = true
				recognition.stop()
			}finally{
				if(!err)
					clearInterval(x)
			}
		}, 200)
	}
}
function pick(word){
	switch(word){
		case words[0]:{
			player.create()
			break
		}
		case words[1]:{
			player.play()
			break
		}
		case words[2]:{
			player.pause()
			break
		}
		case words[3]:{
			player.back()
			break
		}
		case words[4]:{
			player.next()
			break
		}
		case words[5]:{
			player.random()
			break
		}
		case words[6]:{
			player.repeat()
			break
		}
		case words[7]:{
			listBar.click()
			break
		}
		default:{
			console.log(word)
			return
		}
	}
}
/********************************/

//////////////////////////////////
//Music file names AJAX function
//////////////////////////////////
var musicLength = 0
var musicInfo = new Map()
{
    const oReq = new XMLHttpRequest()
	oReq.open("POST", "filename.php", true)
	oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    oReq.onload = ()=> {
			let temp = JSON.parse(oReq.responseText)
			for(let [id, name] of temp.entries()){
				let info = new PlayerGetTime(id, (name.split("./content/").pop()))
				info.time
			}
			musicLength = temp.length
    }
	oReq.send(null)
}
class PlayerGetTime{
	constructor(id, name){
		this.id = id
		this.name = name
		this.pl = document.createElement('audio')
		this.source = document.createElement('source')
		this.source.setAttribute('src', 'content/'+name)
		this.source.setAttribute('type', 'audio/mpeg')
	}
	appened(){
		let p = this.pl
		let s = this.source
		p.appendChild(s)
		return p
	}
	get time(){
		let stat = this.appened()
		let wait = new Promise((resolve, reject)=>{
			let x = setInterval(()=>{
				if(stat.readyState == 4){
					clearInterval(x)
					resolve()
				}
			}, 100)
		}).then(()=>{
			musicInfo.set(this.id, {name:this.name, len:audioLengthConvert(stat.duration)})
		})
	}
}

/****************************************************************/

//////////////////////////////////
//Class player build *test*
//////////////////////////////////
var musicNumber = 0
var previousMusicNumber = 0
var musicVolume = 1.0
var randomBool = false
class Player{
	constructor(url, vol){
		this.pl = document.createElement('audio')
		this.pl.setAttribute('controls', '')
		this.pl.setAttribute('controlsList', 'nodownload')
		this.pl.setAttribute('id', 'audioPlayer')
		this.pl.setAttribute('onended', 'player.repeat()')
		this.pl.volume = vol
		
		this.source = document.createElement('source')
		this.source.setAttribute('src', 'content/'+url)
		this.source.setAttribute('type', 'audio/mpeg')
		this.full = this.pl.appendChild(this.source)
	}
	appened(){
		let p = this.pl
		let s = this.source
		p.appendChild(s)
		return p
	}
	get ctx(){
		return this.appened()
	}
}
/********************************/

//////////////////////////////////
//Object player control
//////////////////////////////////
const player = {
	create:	()=>{
		let x = new Player(musicInfo.get(musicNumber).name, musicVolume)
		audioDiv.innerHTML = ''
		audioDiv.appendChild(x.ctx)
		playPromise() //TEST!
	},
	play:	()=>{
		if(isPaused()){
			audio().play()
			playFa.setAttribute('class', 'fa fa-pause')
		}else{
			return
		}
	},
	pause:	()=>{
		if(!isPaused()){
			audio().pause()
			playFa.setAttribute('class', 'fa fa-play')
		}else{
			return
		}
	},
	next:	()=>{
		if(randomBool){
			player.random()
			return
		}
		if(musicNumber < (musicLength-1)){
			musicNumber++
			player.create()
		}else{
			musicNumber = 0
			player.create()
		}
	},
	back:	()=>{
		if(musicNumber >= 1){
			musicNumber--
			player.create()
		}else{
			musicNumber = musicLength-1
			player.create()
		}
	},
	repeat:	()=>{
		if(isLoop())
			return
		else
			player.next()
	},
	random:	()=>{
		let old = musicNumber
		do{
			musicNumber = Math.floor((Math.random() * (musicLength-1)) + 0)
		}while(musicNumber == old)
		player.create()
	},
	volume:	()=>{
		audio().volume = musicVolume
	}
}
/********************************/

//////////////////////////////////
//Audio api function
//////////////////////////////////
{
	function audio(){
		return document.getElementById('audioPlayer')
	}
	function isPaused(){
		return audio().paused
	}
	function isReady(){
		return audio().readyState
	}
	function currentAudioTime(){
		return Math.floor(audio().currentTime)
	}
	function audioLength(){
		return audio().duration
	}
	function isLoop(){
		return audio().loop
	}
	function timeUpdate(){
		audio().ontimeupdate = ()=>{
			if(barMove){
				timeStartId.innerHTML = audioLengthConvert(currentAudioTime())
				timeBarMove()
			}
		}
	}
	function audioLengthConvert(s){
		let m = Math.floor(s%60)
		if(m<10)
			m = Math.floor((s-m)/60)+':0'+m
		else
			m = Math.floor((s-m)/60)+':'+m
		return m
	}
	function playPromise(){
		let x = new Promise((resolve, reject)=>{
			let y = setInterval(()=>{
				if(isReady() == 4) {
					clearInterval(y)
					resolve()
				}
			}, 100)
		}).then(()=>{
			player.play()
		}).then(()=>{
			getName()
		}).then(()=>{
			timeEndId.innerHTML = musicInfo.get(musicNumber).len
		}).then(()=>{
			timeUpdate()
		}).then(()=>{
			player.volume()
		}).then(()=>{
			if(!isLoop()){
				repeatId.style.backgroundColor = 'transparent'
				repeatFa.style.color = 'white'
			}
		}).then(()=>{
			let x = info.querySelector('div[data-id="'+musicNumber+'"]')
			let y = info.querySelector('div[data-id="'+previousMusicNumber+'"]')
			y.style.background = ''
			x.style.background = '#0000004d'
			previousMusicNumber = musicNumber
		})
	}
	function getName(){
		let y = musicInfo.get(musicNumber).name
		if(y.indexOf('.mp3'))
			y = y.split('.mp3').shift()
		titleId.innerHTML = y
		document.title = y
	}
	function timeBarMove(){
		timeBarFa.style.left = currentAudioTime()/audioLength()*100 + '%'
	}
}
/****************************************************************/

////////////////////////////////////////////////////////////////////
//Add function to HTML elements 
////////////////////////////////////////////////////////////////////

//////////////////////////////////
// Scroll bar var (time update etc.)
//////////////////////////////////
	var pauseBar = false
	var barMove = true
/********************************/
	
//////////////////////////////////
// Title elements
//////////////////////////////////
{
	function clickStart(){
		player.create()
		try{
			titleId.removeEventListener('click', clickStart)
		}catch(e){}
	}	
	titleId.addEventListener('click', clickStart)
}
/********************************/

//////////////////////////////////
//Back button
//////////////////////////////////
{
	let x = ()=>{player.back()}
	backId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
//Next button
//////////////////////////////////
{
	let x = ()=>{player.next()}
	nextId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
//Play/Pause button
//////////////////////////////////
{
	let x = ()=>{
		if(isPaused())
			player.play()
		else
			player.pause()
	}
	playId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
// Time bar moving mouse event listeners
//////////////////////////////////
{
	let elemBall = timeBarFa.offsetWidth
	let centerBall = elemBall/2
	let elemL = timeBarId.getBoundingClientRect().left
	let maxMove =  timeBarId.getBoundingClientRect().right-elemL-elemBall
	let minMove = 0
	
	let proc = 0
	let uptadeTime = (x)=>{
		let temp = Math.floor(audioLength())
		temp = Math.floor(temp*x/100)
		timeStartId.innerText = audioLengthConvert(temp)
	}
	let x = (event)=>{
		let temp = event.clientX-elemL-centerBall
		if(temp > maxMove){
			temp = maxMove
		}else if(temp < minMove){
			temp = minMove
		}
		proc = Math.round(temp/maxMove*100)
		uptadeTime(proc)
		timeBarFa.style.left = temp+'px'
	}
	let timeChange = ()=>{
		audio().currentTime = audioLength()*proc/100
	}
	timeBarFa.addEventListener('mousedown',  ()=>{
		pauseBar = true
		barMove = false
		window.addEventListener('mousemove',  x)
	})
	window.addEventListener('mouseup', ()=>{
		if(pauseBar)
			timeChange()
		pauseBar = false
		barMove = true
		try{
			window.removeEventListener('mousemove', x, false)
		}catch(e){}
	})
	window.addEventListener('resize', ()=>{
		elemL = timeBarId.getBoundingClientRect().left
		maxMove =  timeBarId.getBoundingClientRect().right-elemL-elemBall
	})
}
/********************************/

//////////////////////////////////
// Random button event listeners
//////////////////////////////////
{
	let x = ()=>{
		if(!randomBool){
			randomBool = true
			randomId.style.backgroundColor = 'rgb(242, 242, 242)'
			randomFa.style.color = 'black'
		}else{
			randomBool = false
			randomId.style.backgroundColor = 'transparent'
			randomFa.style.color = 'white'
		}
	}
	randomId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
// Repeat button event listeners
//////////////////////////////////
{
	let x = ()=>{
		if(isLoop()){
			audio().loop = false
			repeatId.style.backgroundColor = 'transparent'
			repeatFa.style.color = 'white'
		}else{
			audio().loop = true
			repeatId.style.backgroundColor = 'rgb(242, 242, 242)'
			repeatFa.style.color = 'black'
		}
	}
	repeatId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
// Mic button event listeners
//////////////////////////////////
{
	let tmp = false
	let x = ()=>{
		if(tmp){
			tmp = false
			control.start()
			micFa.setAttribute('class', 'fa fa-microphone')
			micId.style.backgroundColor = 'transparent'
			micFa.style.color = 'white'
		}else{
			tmp = true
			recognition.stop()
			micFa.setAttribute('class', 'fa fa-microphone-slash')
			micId.style.backgroundColor = 'rgb(242, 242, 242)'
			micFa.style.color = 'black'
		}
	}
	micId.addEventListener('click', x)
}
/********************************/

//////////////////////////////////
// Volume button event listeners
//////////////////////////////////
{
	let elemBall, elemL, maxMove, centerBall
	let minMove = 0
	let tmp = true
	let x = ()=>{
		if(tmp){
			tmp = false
			volumeId.style.backgroundColor = 'rgb(242, 242, 242)'
			volumeFa.style.color = 'black'
			volumeMenuId.style.display = 'grid'
		}else{
			tmp = true
			volumeId.style.backgroundColor = 'transparent' 
			volumeFa.style.color = 'white'
			volumeMenuId.style.display = 'none'
		}
		
	}
	let icoChng = (ico, mute=false)=>{
		if(ico==0){
			volumeIco.setAttribute('class', 'fa fa-volume-off')
			volumeFa.setAttribute('class', 'fa fa-volume-off')
		}
		else if(ico < 0.5){
			volumeIco.setAttribute('class', 'fa fa-volume-down')
			volumeFa.setAttribute('class', 'fa fa-volume-down')
		}
		else{
			volumeIco.setAttribute('class', 'fa fa-volume-up')
			volumeFa.setAttribute('class', 'fa fa-volume-up')
		}
		if(mute){
			volumeIco.setAttribute('class', 'fa fa-volume-off')
			volumeFa.setAttribute('class', 'fa fa-volume-off')
			let audioPl = document.getElementById('audioPlayer')
			volumeScroll.style.left = 0+'%'
			audioPl.volume = 0
		}
	}
	let scrll = (event)=>{
		let temp = event.clientX - elemL - centerBall
		
		if(temp > maxMove)
			temp = maxMove
		if(temp < minMove)
			temp = minMove
		
		musicVolume = Math.floor(temp/maxMove*100)/100
		icoChng(musicVolume)
		volumeScroll.style.left = temp+'px'
		player.volume()
	}
	
	volumeFa.addEventListener('click', x)
	volumeIco.addEventListener('click', ()=>{
			icoChng(0, true)
	})
	volumeScroll.addEventListener('mousedown',  ()=>{
		elemBall = volumeScroll.offsetWidth
		centerBall = (elemBall/2)
		elemL = volumeHrId.getBoundingClientRect().left
		maxMove =  volumeHrId.getBoundingClientRect().right-elemL-elemBall
		window.addEventListener('mousemove',  scrll)
	})
	window.addEventListener('mouseup', ()=>{
		window.removeEventListener('mousemove', scrll, false)
	})
}
/********************************/

//////////////////////////////////
// List music event listeners
//////////////////////////////////
{
	let tmp = true
	listMusic.style.display = 'none'
	
	
	let x = ()=>{
		if(tmp){
			//grid-template-rows:50px; * music list
			tmp = false
			listBar.style.backgroundColor = 'rgb(242, 242, 242)'
			listBarFa.style.color = 'black'
			listMusic.setAttribute('style', 'height:'+300+'px;transition: height 1s;')
			listBarFa.setAttribute('class', 'fa fa-arrow-up')
			setTimeout(()=>{listDiv.style.display = 'grid'}, 1000)
		}else{
			tmp = true
			listBar.style.backgroundColor = 'transparent'
			listBarFa.style.color = 'white'
			listBarFa.setAttribute('class', 'fa fa-arrow-down')
			listMusic.setAttribute('style', 'height:0px;transition: height 1s;')
			listDiv.style.display = 'none'
		}
	}
	
	listBar.addEventListener('click', x, false)	
}
/********************************/

//////////////////////////////////
// List music info
//////////////////////////////////
{
	new Promise((resolve, reject)=>{
		let x = setInterval(()=>{
			if(musicLength && musicInfo.size == musicLength){
				clearInterval(x)
				let y = ''
				for(let [key, object] of musicInfo.entries()){
					y += '<div data-id="'+key+'" class="listed"><span class="title">'+object.name+'</span> <span class="length">'+object.len+'</span><span  class="butonPlay" data-id="'+key+'"><i data-id="'+key+'" class="fa fa-play" aria-hidden="true"></i></span></div>'
				}
				resolve(y)
			}
		}, 200)
	}).then((y)=>{
		listDiv.innerHTML = y
	}).then(()=>{
		listPlay = listMusic.getElementsByClassName('butonPlay')
		let playFromList = (elem)=>{
			musicNumber = parseInt(elem.target.getAttribute('data-id'))
			player.create()
		}
		let over = (elem)=>{
			elem.currentTarget.style.background = 'rgb(242, 242, 242)'
			elem.currentTarget.querySelector('i').style.color = 'black'
		}
		let out = (elem)=>{
			elem.currentTarget.style.background = ''
			elem.currentTarget.querySelector('i').style.color = ''
		}
		for(elem of listPlay){
			elem.addEventListener('click', ()=>{playFromList(event)})
			elem.addEventListener('mouseover', ()=>{over(event)})
			elem.addEventListener('mouseout', ()=>{out(event)})
		}
		
	})
}
/********************************/

/****************************************************************/

//////////////////////////////////
// Start recording
//////////////////////////////////
{
control.start()
}
/********************************/
