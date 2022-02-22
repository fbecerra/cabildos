Promise.all([d3.json("data/cabildos.json")]).then(function(data){
  let cabildos = data[0];
  console.log(cabildos);

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
