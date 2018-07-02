const Autocomplete = {
	init($input, url) {
		this.$input = $input;
		this.$ul = $('ul.autocomplete-ui');
		this.$div = $('div.autocomplete-overlay');
		this.url = url;
		this.selectedPos = null;
		this.bindEvents();
	},

	bindEvents() {
		this.$input.on('input', this.reset.bind(this));
		this.$input.on('input', debounce(this.valueChanged.bind(this), 300));
		this.$input.on('keydown', this.changeSelected.bind(this));
		this.$ul.on('mousedown', this.autofillClicked.bind(this));
	},

	valueChanged(event) {
		if (event.key === ' ') return;
		const query = this.$input.val().trim();
		const xhr = this.newXhrJsonRequest(query);
		xhr.send();
		xhr.onload = () => { this.draw(query, xhr.response) };
	},

	draw(query, json) {
		if (_.isEmpty(json)) return this.reset();			
		this.renderList(json);
		this.renderOverlay(query, json);		
	},

	newXhrJsonRequest(query) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', this.url + query);
		xhr.responseType = 'json';
		return xhr;
	},

	renderList(json) {
		const countries = _(json).pluck('name');
		const countriesHtml = countries.map((country) => '<li>' + country + '</li>');
		this.$ul.html(countriesHtml.join("\n"));
		this.selectedPos = null;
	},

	changeSelected(event) {
		const countriesCount = this.$ul.children().length;
		const key = event.key;
		if (countriesCount === 0) return;
		if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(key))	event.preventDefault();
		if (key === 'ArrowUp') this.selectPrev(countriesCount);
		if (key === 'ArrowDown') this.selectNext(countriesCount);
		if (key === 'Enter' || key === 'Tab') this.autofill();
	},

	selectPrev(count) {
		this.selectedPos = (this.selectedPos === null ? 0 : this.selectedPos);
		this.selectedPos -= 1;
		if (this.selectedPos < 0) this.selectedPos = count - 1;
		this.updateSelected();
	},

	selectNext(count) {
		this.selectedPos = (this.selectedPos === null ? -1 : this.selectedPos);
		this.selectedPos += 1;
		if (this.selectedPos >= count) this.selectedPos = 0;
		this.updateSelected();
	},

	updateSelected() {
		const $lis = this.$ul.children();
		const $selectedLi = $lis.eq(this.selectedPos);
		$lis.removeClass('selected');
		$selectedLi.addClass('selected');
		this.$input.val($selectedLi.text());
		this.$div.empty();
	},

	autofill() {
		const $lis = this.$ul.children();
		const $selectedLi = $lis.eq(this.selectedPos || 0);
		this.$input.val($selectedLi.text());
		this.reset();
	},

	autofillClicked(event) {
		const li = event.target;
		const autofillText = li.textContent;
		this.$input.val(autofillText);
		this.reset();
	},

	renderOverlay(query, json) {
		const firstResult = json[0].name;
		const hiddenText = '<span>' + query + '</span>';
		const overlayText = hiddenText + firstResult.slice(query.length);
		this.$div.html(overlayText);
	},

	reset() {
		this.$div.empty();
		this.$ul.empty();
		this.selectedPos = null;
	}
}