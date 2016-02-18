/// <reference path="../dec/jquery.d.ts"/>
/// <reference path="../dec/jqueryui.d.ts"/>
/// <reference path="../dec/underscore.d.ts"/>

class Model {
	protected $: JQuery;

	constructor() {
		this.$ = $(this);
	}
}

class Data extends Model {
	count: number = 0;
	direction: number = 0; // 0: 正回転を右、1: 逆回転を左とする
	power: number = 0;

	static COUNT_UP_EVENT: string = "countUpEvent";
	static RESET_EVENT: string = "resetEvent";
	static DIRECTION_EVENT: string = "directionEvent";
	static POWER_EVENT: string = "powerEvent";
	static REVISE_EVENT: string = "reviseEvent";
	static CREATE_EVENT: string = "createEvent";

	onCountUp(handler: () => any): void {
        this.$.bind(Data.COUNT_UP_EVENT, handler);
    }
	onReset(handler: () => any): void {
        this.$.bind(Data.RESET_EVENT, handler);
    }
	onChangeDirection(handler: () => any): void {
        this.$.bind(Data.DIRECTION_EVENT, handler);
    }
	onChangePower(handler: () => any): void {
        this.$.bind(Data.POWER_EVENT, handler);
    }
	onRevise(handler: () => any): void {
        this.$.bind(Data.REVISE_EVENT, handler);
    }
	onCreate(handler: () => any): void {
        this.$.bind(Data.CREATE_EVENT, handler);
    }

	constructor() {
		super();
	}

	currentCsv(): string {
		return this.count.toString() + "," + this.direction.toString() + "," + this.power.toString() + "\n"; 
	}

	countUp() {
		this.count++;
		this.$.trigger(Data.COUNT_UP_EVENT);
	}

	countReset() {
		this.count = 0;
		this.$.trigger(Data.RESET_EVENT);
	}

	changeDirection(direction: number) {
		if (direction !== 0 && direction !== 1) direction = 0;
		this.direction = direction;
		this.$.trigger(Data.DIRECTION_EVENT);
		this.revise();
	}

	changePower(power: number) {
		if (power > 100) power = 100;
		if (power < 0) power = 0;
		this.power = power;
		this.$.trigger(Data.POWER_EVENT);
		this.revise();
	}

	revise() {
		this.$.trigger(Data.REVISE_EVENT);
	}

	create() {
		this.$.trigger(Data.CREATE_EVENT);
	}
}

class State extends Model{
	isPlaying: boolean = false;

	static TOGGLE_EVENT: string = "toggleEvent";
	static START_EVENT: string = "startEvent";
	static STOP_EVENT: string = "stopEvent";

	onToggle(handler: () => any): void {
        this.$.bind(State.TOGGLE_EVENT, handler);
    }
	onStart(handler: () => any): void {
        this.$.bind(State.START_EVENT, handler);
    }
	onStop(handler: () => any): void {
        this.$.bind(State.STOP_EVENT, handler);
    }

	constructor() {
		super();
	}

	toggle() {
		this.isPlaying = this.isPlaying ? false : true;
		this.$.trigger(State.TOGGLE_EVENT);
		this.$.trigger(this.isPlaying ? State.START_EVENT : State.STOP_EVENT);
	}
}

class View {
	protected $: JQuery;

	constructor(private id: string, protected model: Object) {
		this.$ = $(id);
	}
}

class TextArea extends View {

	private data: Data = this.model["data"];
	private state: State = this.model["state"];
	private beforeCount: number;
	private beforePower: number;
	private dataNum: number = 0;

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvents();
	}

	private setEvents() {
		this.state.onStart(() => this.setInitial());
		this.data.onCountUp(() => this.checkPower());
		this.data.onRevise(() => this.revise());
		this.data.onReset(() => this.reset());
		this.data.onCreate(() => this.create());
	}

	private setInitial() {
		this.beforeCount = this.data.count;
		this.beforePower = this.data.power;
		this.add();
	}

	private checkPower() {
		if (this.beforePower != this.data.power) this.revise();
	}

	private revise() {
		if (!this.state.isPlaying || this.beforeCount === this.data.count) return;
		this.add();
		this.beforeCount = this.data.count;
		this.beforePower = this.data.power;
	}

	private add() {
		this.$.val(this.$.val() + this.data.currentCsv());
		this.dataNum++;
		this.goToBottom();
	}

	private reset() {
		this.$.val("");
		this.dataNum = 0;
	}

	private goToBottom() {
		if (this.$.length == 0) return;
		this.$.scrollTop(this.dataNum * 20);
	}

	private create() {
		var file: File = new File([this.$.val()], "vorze.csv", { type: 'text/csv' });
		var url = window.URL.createObjectURL(file);
		$("#csvLink").attr({ "href": url, "download": "vorze.csv" });
	}
}

class Count extends View {

	private data: Data = this.model["data"];
	private state: State = this.model["state"];
	private interval: number;

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
		this.reflesh();
	}

	private setEvent() {
		this.data.onReset(() => this.reflesh());
		this.state.onStart(() => this.start());
		this.state.onStop(() => this.stop());
		this.$.on("change", () => this.rewrite());
	}

	private rewrite() {
		var val: number = parseInt(this.$.val(), 10);
		if (_.isNaN(val) || val < 0) alert("Invalied value");
		else this.data.count = val;
		this.reflesh();
	}

	private start() {
		this.data.revise();
		this.interval = setInterval(() => this.countUp(), 100);
	}

	private stop() {
		clearInterval(this.interval);
	}

	private countUp() {
		this.data.countUp();
		this.reflesh();
	}

	private reflesh() {
		this.$.val(this.data.count.toString());
	}
}

class Power extends View {

	private data: Data = this.model["data"];

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
		this.reflesh();
	}

	private setEvent() {
		this.data.onChangePower(() => this.reflesh());
		this.$.on("change", () => this.rewrite());
	}

	private rewrite() {
		var val: number = parseInt(this.$.val(), 10);
		if (_.isNaN(val) || val < 0 || val > 100) alert("Invalied value");
		else this.data.changePower(val);
		this.reflesh();
	}

	private reflesh() {
		this.$.val(this.data.power.toString());
	}
}

class PowerSlider extends View {

	private data: Data = this.model["data"];
	private state: State = this.model["state"];

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
		this.makeSlider();
	}

	private setEvent() {
		
		this.data.onChangePower(() => this.makeSlider());
	}

	private makeSlider() {
		this.$.slider({
			orientation: "vertical",
			range: "min",
			min: 0,
			max: 100,
			value: this.data.power,
			slide: (event, ui) => this.changePower(ui.value),
		});
	}

	private changePower(power: number) {
		this.data.changePower(power);
	}
}

class Direction extends View {

	private data: Data = this.model["data"];

	constructor(id: string, model: Object, private selfDirection) {
		super(id, model);
		this.setEvent();
		this.changeAppearance();
	}

	private setEvent() {
		$(window).keydown((e) => this.checkKeyCode(e.keyCode));
		this.$.click(() => this.changeDirection());
		this.data.onChangeDirection(() => this.changeAppearance());
	}

	private checkKeyCode(keyCode: number) {
		// x かつ このインスタンスが正回転 または z かつ このインスタンスが逆回転
		if (keyCode === 88 && this.selfDirection === 0 || keyCode === 90 && this.selfDirection === 1) {
			this.changeDirection();
		}
	}

	private changeDirection() {
		this.data.changeDirection(this.selfDirection);
	}

	private changeAppearance() {
		this.$.css("background-color", this.data.direction === this.selfDirection ? "#28868b" : "#d3d3d3");
	}
}

class Reset extends View {

	private data: Data = this.model["data"];

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
	}

	private setEvent() {
		this.$.click(() => this.reset());
	}

	private reset() {
		if (confirm("Are you sure to reset the count number and csv data?")) {
			this.data.countReset();
		}
	}
}

class Play extends View {

	private state: State = this.model["state"];

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
	}

	private setEvent() {
		this.state.onToggle(() => this.toggle());
		this.$.click(() => this.state.toggle());
	}

	private toggle() {
		var ip = this.state.isPlaying;
		this.$.text(ip ? "Stop" : "Start");
		this.$.css("background-color", ip ? "#28868b" : "#d3d3d3");
	}
}

class Create extends View {

	private data: Data = this.model["data"];
	private downloadButton: JQuery;

	constructor(id: string, model: Object) {
		super(id, model);
		this.setEvent();
	}

	private setEvent() {
		this.$.click(() => this.create());
	}

	private create() {
		if (!this.downloadButton) {
			this.downloadButton = this.$.after("<a id='csvLink' href=''><button id='download'>Download</button></a>");
		}
		this.data.create();
		alert("New CSV file was created!");
	}
}

window.onload = () => { $(() => {
	var data = new Data();
	var state = new State();
	var textarea = new TextArea("#textarea", { "data": data, "state": state});
	var count = new Count("#count", { "data": data, "state": state});
	var power = new Power("#power", { "data": data, });
	var powerSlider = new PowerSlider("#powerSlider", { "data": data, "state": state});
	var left = new Direction("#left", { "data": data, }, 1);
	var right = new Direction("#right", { "data": data, }, 0);
	var reset = new Reset("#reset", { "data": data, });
	var play = new Play("#play", {"state": state, });
	var create = new Create("#create", { "data": data, });
})};