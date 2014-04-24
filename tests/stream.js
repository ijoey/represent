/*
Code from https://gist.github.com/mjijackson/1201196
*/
var util = require("util")
var Stream = require("stream").Stream;
module.exports = InMemoryStream;
function InMemoryStream(source) {
    Stream.call(this);
    this._chunks = [];
    this._wait = false;
    this.encoding = null;
    this.readable = true;
    this.writable = true;
    var self = this;
    setImmediate(function () {
        if (self.readable || self._chunks.length) {
            var hasData = self._chunks.length != 0;
            var chunk;
            while (self.readable && self._chunks.length && !self._wait) {
                chunk = self._chunks.shift();
                if (self.encoding) self.emit("data", chunk.toString(self.encoding));
                else self.emit("data", chunk);
            }
            if (hasData && self._chunks.length == 0) self.emit("drain");
            setImmediate(arguments.callee);
        }
    });
    if (source instanceof Stream)source.pipe(this);
    else this.end(source);
};
util.inherits(InMemoryStream, Stream);
InMemoryStream.prototype.setEncoding = function setEncoding(encoding) {
    this.encoding = encoding;
};
InMemoryStream.prototype.pause = function pause() {
    this._wait = true;
    this.emit("pause");
};
InMemoryStream.prototype.resume = function resume() {
    this._wait = false;
    this.emit("resume");
};
InMemoryStream.prototype.write = function write(chunk) {
    if (typeof chunk == "string") chunk = new Buffer(chunk);
    this._chunks.push(chunk);
};
InMemoryStream.prototype.end = function end(chunk) {
    if (chunk) this.write(chunk); 
    var self = this;
    this.destroySoon(function () {
        self.emit("end");
    });
};
InMemoryStream.prototype.destroy = function destroy() {
    this._chunks = [];
    this.readable = false;
    this.writable = false;
};
InMemoryStream.prototype.destroySoon = function destroySoon(callback) {
    var self = this;
    setImmediate(function () {
        if (self._chunks.length == 0) {
            self.destroy();
            if (typeof callback == "function") callback();
        } else {
            setImmediate(arguments.callee);
        }
    });
};