/*
Code from https://gist.github.com/mjijackson/1201196
*/
var util = require("util")
var Stream = require("stream").Stream;
module.exports = InMemoryStream;
function InMemoryStream(source) {
    Stream.call(this);
    this._data = [];
    this._wait = false;
    this.encoding = null;
    this.readable = true;
    this.writable = true;
    if (source instanceof Stream) source.pipe(this);
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
    this._data.push(chunk);
    this.emit("data", chunk);
};
InMemoryStream.prototype.end = function end(chunk) {
    if (chunk) this.write(chunk);
    this.emit("end");
};
InMemoryStream.prototype.destroy = function destroy() {
    this._data = [];
    this.readable = false;
    this.writable = false;
};