/// <reference path="../dec/jquery.d.ts"/>
/// <reference path="../dec/jqueryui.d.ts"/>
/// <reference path="../dec/underscore.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Model = (function () {
    function Model() {
        this.$ = $(this);
    }
    return Model;
})();
var Data = (function (_super) {
    __extends(Data, _super);
    function Data() {
        _super.call(this);
        this.count = 0;
        this.direction = 0; // 0: 正回転を右、1: 逆回転を左とする
        this.power = 0;
    }
    Data.prototype.onCountUp = function (handler) {
        this.$.bind(Data.COUNT_UP_EVENT, handler);
    };
    Data.prototype.onReset = function (handler) {
        this.$.bind(Data.RESET_EVENT, handler);
    };
    Data.prototype.onChangeDirection = function (handler) {
        this.$.bind(Data.DIRECTION_EVENT, handler);
    };
    Data.prototype.onChangePower = function (handler) {
        this.$.bind(Data.POWER_EVENT, handler);
    };
    Data.prototype.onRevise = function (handler) {
        this.$.bind(Data.REVISE_EVENT, handler);
    };
    Data.prototype.onCreate = function (handler) {
        this.$.bind(Data.CREATE_EVENT, handler);
    };
    Data.prototype.currentCsv = function () {
        return this.count.toString() + "," + this.direction.toString() + "," + this.power.toString() + "\n";
    };
    Data.prototype.countUp = function () {
        this.count++;
        this.$.trigger(Data.COUNT_UP_EVENT);
    };
    Data.prototype.countReset = function () {
        this.count = 0;
        this.$.trigger(Data.RESET_EVENT);
    };
    Data.prototype.changeDirection = function (direction) {
        if (direction !== 0 && direction !== 1)
            direction = 0;
        this.direction = direction;
        this.$.trigger(Data.DIRECTION_EVENT);
        this.revise();
    };
    Data.prototype.changePower = function (power) {
        if (power > 100)
            power = 100;
        if (power < 0)
            power = 0;
        this.power = power;
        this.$.trigger(Data.POWER_EVENT);
        this.revise();
    };
    Data.prototype.revise = function () {
        this.$.trigger(Data.REVISE_EVENT);
    };
    Data.prototype.create = function () {
        this.$.trigger(Data.CREATE_EVENT);
    };
    Data.COUNT_UP_EVENT = "countUpEvent";
    Data.RESET_EVENT = "resetEvent";
    Data.DIRECTION_EVENT = "directionEvent";
    Data.POWER_EVENT = "powerEvent";
    Data.REVISE_EVENT = "reviseEvent";
    Data.CREATE_EVENT = "createEvent";
    return Data;
})(Model);
var State = (function (_super) {
    __extends(State, _super);
    function State() {
        _super.call(this);
        this.isPlaying = false;
    }
    State.prototype.onToggle = function (handler) {
        this.$.bind(State.TOGGLE_EVENT, handler);
    };
    State.prototype.onStart = function (handler) {
        this.$.bind(State.START_EVENT, handler);
    };
    State.prototype.onStop = function (handler) {
        this.$.bind(State.STOP_EVENT, handler);
    };
    State.prototype.toggle = function () {
        this.isPlaying = this.isPlaying ? false : true;
        this.$.trigger(State.TOGGLE_EVENT);
        this.$.trigger(this.isPlaying ? State.START_EVENT : State.STOP_EVENT);
    };
    State.TOGGLE_EVENT = "toggleEvent";
    State.START_EVENT = "startEvent";
    State.STOP_EVENT = "stopEvent";
    return State;
})(Model);
var View = (function () {
    function View(id, model) {
        this.id = id;
        this.model = model;
        this.$ = $(id);
    }
    return View;
})();
var TextArea = (function (_super) {
    __extends(TextArea, _super);
    function TextArea(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.state = this.model["state"];
        this.dataNum = 0;
        this.setEvents();
    }
    TextArea.prototype.setEvents = function () {
        var _this = this;
        this.state.onStart(function () { return _this.setInitial(); });
        this.data.onCountUp(function () { return _this.checkPower(); });
        this.data.onRevise(function () { return _this.revise(); });
        this.data.onReset(function () { return _this.reset(); });
        this.data.onCreate(function () { return _this.create(); });
    };
    TextArea.prototype.setInitial = function () {
        this.beforeCount = this.data.count;
        this.beforePower = this.data.power;
        this.add();
    };
    TextArea.prototype.checkPower = function () {
        if (this.beforePower != this.data.power)
            this.revise();
    };
    TextArea.prototype.revise = function () {
        if (!this.state.isPlaying || this.beforeCount === this.data.count)
            return;
        this.add();
        this.beforeCount = this.data.count;
        this.beforePower = this.data.power;
    };
    TextArea.prototype.add = function () {
        this.$.val(this.$.val() + this.data.currentCsv());
        this.dataNum++;
        this.goToBottom();
    };
    TextArea.prototype.reset = function () {
        this.$.val("");
        this.dataNum = 0;
    };
    TextArea.prototype.goToBottom = function () {
        if (this.$.length == 0)
            return;
        this.$.scrollTop(this.dataNum * 20);
    };
    TextArea.prototype.create = function () {
        var file = new File([this.$.val()], "vorze.csv", { type: 'text/csv' });
        var url = window.URL.createObjectURL(file);
        $("#csvLink").attr({ "href": url, "download": "vorze.csv" });
    };
    return TextArea;
})(View);
var Count = (function (_super) {
    __extends(Count, _super);
    function Count(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.state = this.model["state"];
        this.setEvent();
        this.reflesh();
    }
    Count.prototype.setEvent = function () {
        var _this = this;
        this.data.onReset(function () { return _this.reflesh(); });
        this.state.onStart(function () { return _this.start(); });
        this.state.onStop(function () { return _this.stop(); });
        this.$.on("change", function () { return _this.rewrite(); });
    };
    Count.prototype.rewrite = function () {
        var val = parseInt(this.$.val(), 10);
        if (_.isNaN(val) || val < 0)
            alert("Invalied value");
        else
            this.data.count = val;
        this.reflesh();
    };
    Count.prototype.start = function () {
        var _this = this;
        this.data.revise();
        this.interval = setInterval(function () { return _this.countUp(); }, 100);
    };
    Count.prototype.stop = function () {
        clearInterval(this.interval);
    };
    Count.prototype.countUp = function () {
        this.data.countUp();
        this.reflesh();
    };
    Count.prototype.reflesh = function () {
        this.$.val(this.data.count.toString());
    };
    return Count;
})(View);
var Power = (function (_super) {
    __extends(Power, _super);
    function Power(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.setEvent();
        this.reflesh();
    }
    Power.prototype.setEvent = function () {
        var _this = this;
        this.data.onChangePower(function () { return _this.reflesh(); });
        this.$.on("change", function () { return _this.rewrite(); });
    };
    Power.prototype.rewrite = function () {
        var val = parseInt(this.$.val(), 10);
        if (_.isNaN(val) || val < 0 || val > 100)
            alert("Invalied value");
        else
            this.data.changePower(val);
        this.reflesh();
    };
    Power.prototype.reflesh = function () {
        this.$.val(this.data.power.toString());
    };
    return Power;
})(View);
var PowerSlider = (function (_super) {
    __extends(PowerSlider, _super);
    function PowerSlider(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.state = this.model["state"];
        this.setEvent();
        this.makeSlider();
    }
    PowerSlider.prototype.setEvent = function () {
        var _this = this;
        this.data.onChangePower(function () { return _this.makeSlider(); });
    };
    PowerSlider.prototype.makeSlider = function () {
        var _this = this;
        this.$.slider({
            orientation: "vertical",
            range: "min",
            min: 0,
            max: 100,
            value: this.data.power,
            slide: function (event, ui) { return _this.changePower(ui.value); },
        });
    };
    PowerSlider.prototype.changePower = function (power) {
        this.data.changePower(power);
    };
    return PowerSlider;
})(View);
var Direction = (function (_super) {
    __extends(Direction, _super);
    function Direction(id, model, selfDirection) {
        _super.call(this, id, model);
        this.selfDirection = selfDirection;
        this.data = this.model["data"];
        this.setEvent();
        this.changeAppearance();
    }
    Direction.prototype.setEvent = function () {
        var _this = this;
        $(window).keydown(function (e) { return _this.checkKeyCode(e.keyCode); });
        this.$.click(function () { return _this.changeDirection(); });
        this.data.onChangeDirection(function () { return _this.changeAppearance(); });
    };
    Direction.prototype.checkKeyCode = function (keyCode) {
        // x かつ このインスタンスが正回転 または z かつ このインスタンスが逆回転
        if (keyCode === 88 && this.selfDirection === 0 || keyCode === 90 && this.selfDirection === 1) {
            this.changeDirection();
        }
    };
    Direction.prototype.changeDirection = function () {
        this.data.changeDirection(this.selfDirection);
    };
    Direction.prototype.changeAppearance = function () {
        this.$.css("background-color", this.data.direction === this.selfDirection ? "#28868b" : "#d3d3d3");
    };
    return Direction;
})(View);
var Reset = (function (_super) {
    __extends(Reset, _super);
    function Reset(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.setEvent();
    }
    Reset.prototype.setEvent = function () {
        var _this = this;
        this.$.click(function () { return _this.reset(); });
    };
    Reset.prototype.reset = function () {
        if (confirm("Are you sure to reset the count number and csv data?")) {
            this.data.countReset();
        }
    };
    return Reset;
})(View);
var Play = (function (_super) {
    __extends(Play, _super);
    function Play(id, model) {
        _super.call(this, id, model);
        this.state = this.model["state"];
        this.setEvent();
    }
    Play.prototype.setEvent = function () {
        var _this = this;
        this.state.onToggle(function () { return _this.toggle(); });
        this.$.click(function () { return _this.state.toggle(); });
    };
    Play.prototype.toggle = function () {
        var ip = this.state.isPlaying;
        this.$.text(ip ? "Stop" : "Start");
        this.$.css("background-color", ip ? "#28868b" : "#d3d3d3");
    };
    return Play;
})(View);
var Create = (function (_super) {
    __extends(Create, _super);
    function Create(id, model) {
        _super.call(this, id, model);
        this.data = this.model["data"];
        this.setEvent();
    }
    Create.prototype.setEvent = function () {
        var _this = this;
        this.$.click(function () { return _this.create(); });
    };
    Create.prototype.create = function () {
        if (!this.downloadButton) {
            this.downloadButton = this.$.after("<a id='csvLink' href=''><button id='download'>Download</button></a>");
        }
        this.data.create();
        alert("New CSV file was created!");
    };
    return Create;
})(View);
window.onload = function () {
    $(function () {
        var data = new Data();
        var state = new State();
        var textarea = new TextArea("#textarea", { "data": data, "state": state });
        var count = new Count("#count", { "data": data, "state": state });
        var power = new Power("#power", { "data": data, });
        var powerSlider = new PowerSlider("#powerSlider", { "data": data, "state": state });
        var left = new Direction("#left", { "data": data, }, 1);
        var right = new Direction("#right", { "data": data, }, 0);
        var reset = new Reset("#reset", { "data": data, });
        var play = new Play("#play", { "state": state, });
        var create = new Create("#create", { "data": data, });
    });
};
//# sourceMappingURL=app.js.map