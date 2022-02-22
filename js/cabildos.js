state = {
  cabildo: 'Todos',
  comision: 'Todas',
  tema: 'Todos',
}
const transitionTime = 500;

Promise.all([d3.json("data/cabildos.json")]).then(function(data){
  let cabildos = data[0];
  console.log(cabildos);

  function getUniqueElements(df, thisVariable) {

    let thisList = df.map(o => o[thisVariable]);

    // uniq() found here https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    function uniq(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        });
    }

    let uniqueList = uniq(thisList);

    return uniqueList;
  }

  function addOptions(id, values, attrs) {
    var element = d3.select("#"+id);
    var options = element.selectAll("option").data(values);

    options.enter().append("option")
      .attr("value", (d,i) => attrs[i])
      .html(d => d);

    options.attr("value", (d,i) => attrs[i])
      .html(d => d);

    options.exit().remove();

    return element;
  }

  let allCabildos, allComisiones, allTemas;

  // let allCabildos = getUniqueElements(cabildos.children, 'name');
  // let allComisiones = getUniqueElements(cabildos.children.map(d => d.children).flat(), 'name');
  // let allTemas = getUniqueElements(cabildos.children.map(d => d.children.map(c => c.children).flat()).flat(), 'name');

  function updateOptions() {

    let filteredCabildos = cabildos.children.filter(d => {
      let thisLevel = (d.name === state.cabildo || state.cabildo === 'Todos');
      let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.name === state.comision)
                        .reduce((a,b) => a || b, false);
      let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
                             .map(e => state.tema === 'Todos' || e.name === state.tema)
                             .reduce((a,b) => a || b, false);
      return (thisLevel && lowerLevel && lowerLowerLevel);
    })

    let filteredComisiones = filteredCabildos.map(d => {
      return d.children.filter(e => {
        let thisLevel = e.name === state.comision || state.comision === 'Todas';
        let lowerLevel = e.children.map(c => state.tema === 'Todos' || c.name === state.tema).reduce((a,b) => a || b, false);
        return (thisLevel && lowerLevel);
      }).flat()
    }).flat()

    let filteredTemas = filteredCabildos.map(d => d.children.filter(e => e.name === state.comision || state.comision === 'Todas').map(c => c.children.filter(e => e.name === state.tema || state.tema === 'Todos')).flat()).flat();

    allCabildos = getUniqueElements(filteredCabildos, 'name');
    allComisiones = getUniqueElements(filteredComisiones, 'name');
    allTemas = getUniqueElements(filteredTemas, 'name');


    let selectCabildo = addOptions("select-cabildo", ['Todos', ...allCabildos], ['Todos', ...allCabildos]);
    if (state.cabildo !== 'Todos') {
      selectCabildo.node().value = state.cabildo;
    } else {
      state.cabildo = selectCabildo.node().value;
    }
    selectCabildo.on("change", (event, d) => {
      state.cabildo = event.target.value;
      updateOptions();
      hideCircles();
    });

    let selectComision = addOptions("select-comision", ['Todas', ...allComisiones], ['Todas', ...allComisiones]);
    if (state.comision !== 'Todos') {
      selectComision.node().value = state.comision;
    } else {
      state.comision = selectComision.node().value;
    }
    selectComision.on("change", (event, d) => {
      state.comision = event.target.value;
      updateOptions();
      hideCircles();
    });

    let selectTema = addOptions("select-tema", ['Todos', ...allTemas], ['Todos', ...allTemas]);
    if (state.tema !== 'Todos') {
      selectTema.node().value = state.tema;
    } else {
      state.tema = selectTema.node().value;
    }
    selectTema.on("change", (event, d) => {
      state.tema = event.target.value;
      updateOptions();
      hideCircles();
    });
  }

  updateOptions();

  function hideCircles() {
    let calculateOpacity = d => {
      if (d.depth === 1) {
        console.log(d)
        let thisLevel = (d.data.name === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.data.name === state.comision)
                          .reduce((a,b) => a || b, false);
        let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
                               .map(e => state.tema === 'Todos' || e.data.name === state.tema)
                               .reduce((a,b) => a || b, false);
        return (thisLevel && lowerLevel && lowerLowerLevel) ? 1 : 0;
      } else if (d.depth === 2) {
        let thisLevel = (d.data.name === state.comision || state.comision === 'Todas');
        let upperLevel = (d.parent.data.name === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.tema === 'Todos' || c.data.name === state.tema)
                          .reduce((a,b) => a || b, false);
        return (thisLevel && upperLevel && lowerLevel) ? 1 : 0;
      } else if (d.depth === 3) {
        let thisLevel = (d.data.name === state.tema || state.tema === 'Todos')
        let upperLevel = (d.parent.data.name === state.comision || state.comision === 'Todas');
        let upperUpperLevel = (d.parent.parent.data.name === state.cabildo || state.cabildo === 'Todos');
        return (thisLevel && upperLevel && upperUpperLevel) ? 1 : 0;
      }
    }

    node.transition()
      .duration(transitionTime)
      .attr("opacity", calculateOpacity);

    label.transition()
      .duration(transitionTime)
      .attr("opacity", calculateOpacity);

    groupLabels.transition()
      .duration(transitionTime)
      .attr("opacity", calculateOpacity);
  }


  let color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

  let format = d3.format(",d");

  const width = 800,
        height = width;
  const charSize = 12;

  let pack = data => d3.pack()
    .size([width, height])
    .padding(charSize)
  (d3.hierarchy(data)
    .sum(d => d.porcentaje)
    .sort((a, b) => b.porcentaje - a.porcentaje));

  const root = pack(cabildos);
  console.log(root)
  let focus = root;
  let view;

  const svg = d3.select("#cabildos").append("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .style("display", "block")
      .style("margin", "0 -14px")
      // .style("background", color(0))
      .style("cursor", "pointer")
      .on("click", (event) => zoom(event, root));

  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
      .attr('stroke', d => d.children ? 'lightgrey' : color(d.data.comision))
      .attr('stroke-width', 1.0)
      .attr("fill", d => d.children ? "white" : color(d.data.comision))
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
      .on("mouseout", function() { d3.select(this).attr("stroke", "lightgrey"); })
      .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    const startAngle = -Math.PI / 4;
  	let labelArc = d3.arc();

		labelArc.innerRadius(function(d) { return (d.r); })
				.outerRadius(function(d) { return (d.r); })
				.startAngle(startAngle)
				.endAngle(function(d) {
					const total = d.data.name.length;
					const step = charSize / d.r;
					return startAngle + (total * step);
				});

  	const groupLabels = svg
  			.selectAll(".group")
				.data(root.descendants().slice(1).filter(function(d) { return d.children; })).enter()
			.append("g")
				.attr("class", "group")
					.attr("transform", function(d) { return `translate(${d.x},${d.y})`; });

    groupLabels
  		.append("path")
  			.attr("class", "group-arc")
  			.attr("id", function(d,i) { return `arc${i}`; })
  			.attr("d", labelArc);

  	groupLabels
  		.append("text")
  			.attr("class", "group-label")
        .attr("font-size", charSize)
        .attr("fill", "lightgrey")
  			.attr("x", 0)
  			.attr("dy", charSize * 1.5)
  		.append("textPath")
  			.attr("xlink:href", function(d,i){ return `#arc${i}`;})
  			.text(function(d) { return d.data.name ;});

  const label = svg.append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants().slice(1).filter(function(d) { return !d.children; }))
    .join("text")
      .style("fill-opacity", 1)
      .style("display", "inline")
      .text(d => d.data.name);

  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];

    view = v;

    labelArc.innerRadius(d => d.r * k)
			.outerRadius(d => d.r * k);
    groupLabels.selectAll(".group-arc")
  			.attr("d", labelArc)
    groupLabels.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;

    focus = d;

    const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

    // label
    //   .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
    //   .transition(transition)
    //     .style("fill-opacity", d => d.parent === focus ? 1 : 0)
    //     .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
    //     .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }
})
