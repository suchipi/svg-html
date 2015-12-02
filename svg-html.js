Polymer({
  // A container element that converts its children html elements into svg elements.
  // This allows you to use polymer databinding within inline svg documents.

  // To do so, simply use an svg-html tag where you would normally use an svg tag,
  // and then make sure to use attribute binding in the document instead of
  // property binding. You'll also have to non-self-closing HTML tags.

  // In this example, we bind the rect's fill attribute to the color property.
  // Note that `rect` is normally a self-closing tag, but we have to close it
  // ourselves when using svg-html.

  //  <svg-html>
  //    <rect x="0" y="0" width="100" height="100" fill$="{{color}}"></rect>
  //  </svg-html>

  // This element uses ES6 syntax, MutationObserver, and WeakMap.
  // You may need to transpile and/or use polyfills.
  // Polymer full provides a MutationObserver polyfill;
  // For the others, you can use 'babel' and 'babel-polyfill'.

  'is': 'svg-html',

  // In a nutshell, it keeps all the html elements you give it in a hidden div,
  // then recreates a new element in the SVG namespace representing each element
  // you created, and hooks them up to have the same DOM tree representation.

  // Then it observes changes to the html elements you made and replicates them to the
  // svg elements it created.
  properties: {
    // All of these properties affect the enclosing svg tag

    // Affects the viewBox of the svg tag, but is set as view-box on the html element,
    // by Polymer convention.
    viewBox: {
      type: String,
      observer: "_viewBoxChanged"
    },

    height: {
      type: Number,
      observer: "_heightChanged"
    },

    width: {
      type: Number,
      observer: "_widthChanged"
    }
  },

  _viewBoxChanged(newVal) {
    if (newVal)
      this.$.svg.setAttributeNS(null, "viewBox", newVal);
  },

  _heightChanged(newVal) {
    if (newVal)
      this.$.svg.setAttributeNS(null, "height", newVal);
  },

  _widthChanged(newVal) {
    if (newVal)
      this.$.svg.setAttributeNS(null, "width", newVal);
  },

  attached() {
    var children = Polymer.dom(this).children;
    children.forEach((htmlEl) => {
      this.replicateHtmlToSvg(htmlEl);
    });

    this.associateElements(this.$.htmlContent, this.$.svg);
    this.observeChanges(this.$.htmlContent);
  },

  replicateHtmlToSvg(htmlEl, parentSvgEl) {
    var svgEl = this.createSvgElementFrom(htmlEl);

    Polymer.dom(htmlEl).children.forEach((child) => {
      this.replicateHtmlToSvg(child, svgEl)
    });

    if (!parentSvgEl)
      parentSvgEl = this.$.svg;

    parentSvgEl.appendChild(svgEl);
  },

  // HTML tags are case-insensitive, but svg tags are case-sensitive.
  // Because we are converting html elements, we don't know what case
  // the user wrote in their document, but need it to create the
  // appropriate svg element. So we use this cheat sheet to find the
  // proper casing.
  // If it isn't on the cheat sheet, we just assume it should be
  // all lowercase.
  tagMap: {
    ALTGLYPH: 'altGlyph',
    ALTGLYPHDEF: 'altGlyphDef',
    ALTGLYPHITEM: 'altGlyphItem',
    ANIMATECOLOR: 'animateColor',
    ANIMATEMOTION: 'animateMotion',
    ANIMATETRANSFORM: 'animateTransform',
    CLIPPATH: 'clipPath',
    FEBLEND: 'feBlend',
    FECOLORMATRIX: 'feColorMatrix',
    FECOMPONENTTRANSFER: 'feComponentTransfer',
    FECOMPOSITE: 'feComposite',
    FECONVOLVEMATRIX: 'feConvolveMatrix',
    FEDIFFUSELIGHTING: 'feDiffuseLighting',
    FEDISTANTLIGHT: 'feDistantLight',
    FEFLOOD: 'feFlood',
    FEFUNCA: 'feFuncA',
    FEFUNCB: 'feFuncB',
    FEFUNCG: 'feFuncG',
    FEFUNCR: 'feFuncR',
    FEGAUSSIANBLUR: 'feGaussianBlur',
    FEIMAGE: 'feImage',
    FEMERGE: 'feMerge',
    FEMERGENODE: 'feMergeNode',
    FEMORPHOLOGY: 'feMorphology',
    FEOFFSET: 'feOffset',
    FEPOINTLIGHT: 'fePointLight',
    FESPECULARLIGHTING: 'feSpecularLighting',
    FESPOTLIGHT: 'feSpotLight',
    FETILE: 'feTile',
    FETURBULENCE: 'feTurbulence',
    FOREIGNOBJECT: 'foreignObject',
    GLYPHREF: 'glyphRef',
    LINEARGRADIENT: 'linearGradient',
    RADIALGRADIENT: 'radialGradient',
    TEXTPATH: 'textPath'
  },

  createSvgElementFrom(htmlEl) {
    var svgTag = this.tagMap[htmlEl.tagName] || htmlEl.tagName.toLowerCase();
    var svgNamespace = "http://www.w3.org/2000/svg";
    var svgEl = document.createElementNS(svgNamespace, svgTag);

    var attributes = this.collectAttributesFrom(htmlEl);
    this.applyAttributesTo(svgEl, attributes);

    if (htmlEl.children.length === 0)
      svgEl.textContent = htmlEl.textContent;
    this.associateElements(htmlEl, svgEl);
    this.observeChanges(htmlEl);

    return svgEl;
  },

  collectAttributesFrom(el) {
    var attributes = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var attribute = el.attributes[i];
      if (attribute.specified)
        attributes[attribute.name] = attribute.value;
    }
    return attributes;
  },

  applyAttributesTo(svgEl, attributes) {
    Object.keys(attributes).forEach(function(key){
      var value = attributes[key];
      svgEl.setAttributeNS(null, key, value);
    });
  },

  // Keep track of which elements map to each other.
  // html elements are the keys, svg elements are the values
  elementMap: new WeakMap,

  associateElements(htmlEl, svgEl) {
    this.elementMap.set(htmlEl, svgEl);
  },

  getSvgElementFor(htmlEl) {
    return this.elementMap.get(htmlEl);
  },

  removeHtmlElement(htmlEl) {
    var svgEl = this.getSvgElementFor(htmlEl);
    this.elementMap.delete(htmlEl);

    if (htmlEl.parentElement && htmlEl.parentElement.contains(htmlEl))
      htmlEl.parentElement.removeChild(htmlEl);

    if (svgEl.parentElement && svgEl.parentElement.contains(svgEl))
      svgEl.parentElement.removeChild(svgEl);
  },

  // Keep references to all our MutationObservers
  observers: [],

  observeChanges(htmlEl) {
    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.processMutation(mutation);
      });
    });

    observer.observe(htmlEl, {
      attributes: true,
      childList: true,
      characterData: true
    });
    this.observers.push(observer);
  },

  processMutation(mutation) {
    if (mutation.type === "attributes") {
      this.processAttributeChange(mutation);
    } else if (mutation.type === "childList") {
      if (mutation.addedNodes.length > 0) {
        this.processChildNodeAddition(mutation);
      }

      if (mutation.removedNodes.length > 0) {
        this.processChildNodeRemoval(mutation);
      }
    } else {
      console.log(mutation);
    }
  },

  processAttributeChange(mutation) {
    var key = mutation.attributeName;
    var value = mutation.target.getAttribute(key);

    var svgEl = this.getSvgElementFor(mutation.target);
    svgEl.setAttributeNS(null, key, value);
  },

  processChildNodeAddition(mutation) {
    var parentSvgEl = this.getSvgElementFor(mutation.target);
    Array.prototype.forEach.call(mutation.addedNodes, (htmlEl) => {
      this.replicateHtmlToSvg(htmlEl, parentSvgEl);
    });
  },

  processChildNodeRemoval(mutation) {
    var parentSvgEl = this.getSvgElementFor(mutation.target);
    Array.prototype.forEach.call(mutation.removedNodes, (htmlEl) => {
      this.removeHtmlElement(htmlEl);
    });
  }
});