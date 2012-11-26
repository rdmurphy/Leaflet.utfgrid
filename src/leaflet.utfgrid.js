



L.UtfGrid = L.Class.extend({
	includes: L.Mixin.Events,
	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,

		resolution: 2,
		preload: true,

		clickCallback: null,
		moveCallback: null,

	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);

		this._url = url;

		this._cache = {};

		if (options.clickCallback) {
			//TODO
		}
	},

	onAdd: function (map) {
		this._map = map;

		this._update();

		//TODO: on moveend update
		var zoom = this._map.getZoom();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		map.on('click', function (e) {

			var x = Math.floor(e.layerPoint.x / this.options.tileSize), //FIXME: This can be -1 sometimes
			    y = Math.round(e.layerPoint.y / this.options.tileSize),
			    gridX = Math.floor((e.layerPoint.x - (x * this.options.tileSize)) / this.options.resolution),
			    gridY = Math.floor((e.layerPoint.y - (y * this.options.tileSize) + (this.options.tileSize / 2)) / this.options.resolution);

			var data = this._cache[map.getZoom() + '.' + x + '.' + y];
			if (!data) {
				//console.log('not cached ' + map.getZoom() + '.' + x + '.' + y);
				this.options.clickCallback({ latlng: e.latlng, data: null });
				return;
			}

			var idx = this._utfDecode(data.grid[gridY][gridX]),
			    key = data.keys[idx],
			    result = data.data[key];

			this.options.clickCallback({ latlng: e.latlng, data: result });
		}, this);
	},

	//Load up all required json grid files
	//TODO: Load from center etc
	_update: function () {

		//TODO: on moveend update
		var bounds = this._map.getPixelBounds(),
		    zoom = this._map.getZoom(),
		    tileSize = this.options.tileSize;

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var nwTilePoint = new L.Point(
				Math.floor(bounds.min.x / tileSize),
				Math.floor(bounds.min.y / tileSize)),
			seTilePoint = new L.Point(
				Math.floor(bounds.max.x / tileSize),
				Math.floor(bounds.max.y / tileSize));

		//Load all required ones
		for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) {
			for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) {
				this._loadTile(zoom, x, y);
			}
		}
	},

	_loadTile: function(zoom, x, y) {
		var url = L.Util.template(this._url, L.extend({
			//s: this._getSubdomain(tilePoint),
			z: zoom,
			x: x,
			y: y
		}, this.options));

		var key = zoom + '.' + x + '.' + y;

		//FIXME: JQUERYING IN THE HJIZZLE
		//FIXME: NEED JSONP SUPPORT TOO
		$.ajax({
			url: url,
			context: this,
			type: 'GET'
		})
		.done(function (data) {
			this._cache[key] = data;
		})
		.fail(function () {
			console.log("Failed to load " + url);
		});
	},
	_utfDecode: function (c) {
		c = c.charCodeAt(0);
		if (c >= 93)
			c--;
		if (c >= 35)
			c--;
		return c - 32;
	}
});