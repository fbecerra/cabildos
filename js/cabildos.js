state = {
  cabildo: 'Todos',
  comision: 'Todas',
  tema: 'Todos',
  showing: 'circles'
}
const transitionTime = 500;

const container = d3.select("#cabildos");

d3.select("#how-to")
  .on("click", () => d3.select("#legend").classed("show", !d3.select("#legend").classed("show")))

window.onclick = function(event) {
  let parent = document.getElementById("how-to");
  if (!event.path.includes(parent)) {
    var dropdown = document.getElementById("legend");
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
}

Promise.all([d3.json("data/cabildos.json")]).then(function(data){

  const isMobile = window.innerWidth < 760;

  let cabildos = data[0];
  console.log(cabildos);

  const height = 550,
        width = height;
  const charSize = 2;

  let pack = data => d3.pack()
    .size([height, width])
    .padding(charSize)
  (d3.hierarchy(data)
    .sum(d => d.porcentaje)
    .sort((a, b) => b.porcentaje - a.porcentaje));

  const root = pack(cabildos);
  console.log(root)
  let focus = root;
  let view;

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

  function getUniqueElementsTwoLevels(df, thisVariable, thatVariable) {

    let thisList = df.map(o => o[thisVariable][thatVariable]);

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

  let allCabildos = getUniqueElements(cabildos.children, 'id');
  let allComisiones = getUniqueElements(cabildos.children.map(d => d.children).flat(), 'id');
  let allTemas = getUniqueElements(cabildos.children.map(d => d.children.map(c => c.children).flat()).flat(), 'id');

  function updateOptions() {

    let filteredCabildos = root.children.filter(d => {
      let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.data.id === state.comision)
        .reduce((a,b) => a || b, false);
      let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
        .map(c => state.tema === 'Todos' || c.data.id === state.tema)
        .reduce((a,b) => a || b, false);
      return lowerLevel && lowerLowerLevel
    })

    let filteredComisiones = root.children.map(d => d.children.flat()).flat()
      .filter(d => {
        let upperLevel = state.cabildo === 'Todos' ||  d.parent.data.id == state.cabildo;
        let lowerLevel = d.children.map(c => state.tema === 'Todos' || c.data.id === state.tema)
          .reduce((a,b) => a || b, false);
        return upperLevel && lowerLevel;
      })

    let filteredTemas = cabildos.children.filter(d => state.cabildo === 'Todos' || d.id === state.cabildo)
      .map(d => d.children.flat())
      .flat()
      .filter(d => state.comision === 'Todas' || d.id === state.comision)
      .map(d => d.children.flat())
      .flat();

    let theseCabildos = getUniqueElementsTwoLevels(filteredCabildos, 'data', 'id');
    let theseComisiones = getUniqueElementsTwoLevels(filteredComisiones, 'data', 'id');
    let theseTemas = getUniqueElements(filteredTemas, 'id');

    let allCabildosNames = theseCabildos.map(d => cabildos.cabildos[d].longName);
    let allComisionesNames = theseComisiones.map(d => cabildos.comisiones[d].longName);
    let allTemasNames = theseTemas.map(d => cabildos.temas[d].shortName);

    let selectCabildo = addOptions("select-cabildo", ['Todos', ...allCabildosNames], ['Todos', ...theseCabildos]);
    if (state.cabildo !== 'Todos') {
      selectCabildo.node().value = state.cabildo;
    } else {
      state.cabildo = selectCabildo.node().value;
    }
    selectCabildo.on("change", (event, d) => {
      state.cabildo = event.target.value;
      updateOptions();
      if (state.showing === 'circles') {
        hideCircles();
      } else if (state.showing === 'details') {
        updateDiv(state.cabildo)
      }
    });

    let selectComision = addOptions("select-comision", ['Todas', ...allComisionesNames], ['Todas', ...theseComisiones]);
    if (state.comision !== 'Todos') {
      selectComision.node().value = state.comision;
    } else {
      state.comision = selectComision.node().value;
    }
    selectComision.on("change", (event, d) => {
      state.comision = event.target.value;
      updateOptions();
      if (state.showing === 'circles') {
        hideCircles();
      } else if (state.showing === 'details') {
        if (state.comision === 'Todas') {
          scrollTo(0,0);
        } else {
          scrollToElement(state.comision);
        }
      }
    });

    let selectTema = addOptions("select-tema", ['Todos', ...allTemasNames], ['Todos', ...theseTemas]);
    if (state.tema !== 'Todos') {
      selectTema.node().value = state.tema;
    } else {
      state.tema = selectTema.node().value;
    }
    selectTema.on("change", (event, d) => {
      state.tema = event.target.value;
      updateOptions();
      if (state.showing === 'circles') {
        hideCircles();
      } else if (state.showing === 'details') {
        if (state.tema === 'Todos') {
          scrollTo(0,0);
        } else {
          scrollToElement(state.tema);
        }
      }
    });
  }

  updateOptions();

  function hideCircles() {
    let isSelected = d => {
      if (d.depth === 1) {
        let thisLevel = (d.data.id === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.data.id === state.comision)
                          .reduce((a,b) => a || b, false);
        let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
                               .map(e => state.tema === 'Todos' || e.data.id === state.tema)
                               .reduce((a,b) => a || b, false);
        return (thisLevel && lowerLevel && lowerLowerLevel);
      } else if (d.depth === 2) {
        let thisLevel = (d.data.id === state.comision || state.comision === 'Todas');
        let upperLevel = (d.parent.data.id === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.tema === 'Todos' || c.data.id === state.tema)
                          .reduce((a,b) => a || b, false);
        return (thisLevel && upperLevel && lowerLevel);
      } else if (d.depth === 3) {
        let thisLevel = (d.data.id === state.tema || state.tema === 'Todos')
        let upperLevel = (d.parent.data.id === state.comision || state.comision === 'Todas');
        let upperUpperLevel = (d.parent.parent.data.id === state.cabildo || state.cabildo === 'Todos');
        return (thisLevel && upperLevel && upperUpperLevel);
      }
    }

    node.transition()
      .duration(transitionTime)
      .each(d => d.selected = isSelected(d))
      .style("opacity", d => d.selected ? 1 : 0)
      .style("pointer-events", d => d.selected ? "auto" : "none");

    label.transition()
      .duration(transitionTime)
      .style("opacity", ([d, cell]) => isSelected(d) ? 1 : 0);

    nodeLabel.transition()
      .duration(transitionTime)
      .style("opacity", d => isSelected(d) ? 1 : 0);
  }

  const svgHeight = window.innerHeight * 0.95 - d3.select("#sticky").node().getBoundingClientRect().height,
        svgWidth = isMobile ? 2/3 * svgHeight : 1.5 * svgHeight;

  const svg = d3.select("#cabildos").append("svg")
      .attr("viewBox", [0, 0, svgWidth, svgHeight])
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic; position: relative;")
      .attr("text-anchor", "middle");

  const offset = isMobile ? 0 : (height - svgWidth) / 2;
  const nodeYOffset = isMobile ? 0 : -40;
  const rMin = isMobile ? 20 : 15;

  function updateDiv(id) {

    let cabildo = cabildos.children.filter(d => d.id == id);
    let comisiones = cabildo[0].children.sort((a, b) => ('' + a.name).localeCompare(b.name))
          .filter(c => c.hasOwnProperty("wordCloud") || c.children.reduce((a,b) => a || b.hasOwnProperty("wordCloud") || b.hasOwnProperty("wordTree") || b.hasOwnProperty("wordNetwork"), false))
    let temas = comisiones.map(c => c.children.flat()).flat().sort((a,b) => b.porcentaje - a.porcentaje);
    let temasBar = cabildo[0].children.map(d => d.children.filter(c => c.hasOwnProperty("porcentaje")).flat())
      .flat()
      .sort((a,b) => b.porcentaje - a.porcentaje);

    let svgBarMargin = {top: 40, left: 350, bottom: 20, right: 50},
        svgBarWidth = 500 + svgBarMargin.left + svgBarMargin.right,
        svgBarHeight = temasBar.length * 20 + svgBarMargin.top + svgBarMargin.bottom;

    let xScale = d3.scaleLinear()
      .domain([0, temasBar[0].porcentaje])
      .range([0, svgBarWidth - svgBarMargin.left - svgBarMargin.right]);

    let yScale = d3.scaleLinear()
      .domain([0, temasBar.length - 1])
      .range([svgBarMargin.top, svgBarHeight - svgBarMargin.top - svgBarMargin.bottom]);

    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale).tickValues(d3.range(temasBar.length)).tickFormat(d => cabildos.temas[temasBar[d].id].shortName);

    let details = d3.select("#details");
    details.selectAll("*").remove();
    let detailsWidth = details.node().getBoundingClientRect().width;

    d3.select(window).on("scroll", (event, d) => {
      if (state.showing === 'details') {
        let yOffset = d3.select("#sticky").node().getBoundingClientRect().height;
        let filteredComisiones = comisiones.filter(c => {
          let rect = d3.select("#" + c.id).node().getBoundingClientRect();
          return ((rect.top - yOffset < 0) & (0 < rect.top + rect.height - yOffset));
        })
        if (filteredComisiones.length === 1) {
          state.comision = filteredComisiones[0].id;
        } else {
          state.comision = 'Todas';
        }
        d3.select("#select-comision").node().value = state.comision;

        updateOptions();
      }
    })

    let divCabildo = details.selectAll(".cabildo-title")
      .data(cabildo)
      .join("div")
        .attr("class", "cabildo-title")
        .html(d => cabildos.cabildos[d.id].longName);

    let svgBar = details.selectAll("svg")
      .data(cabildo)
      .join("svg")
        .attr("class", "bar-chart")
        .attr("width", svgBarWidth)
        .attr("height", svgBarHeight)

    svgBar.append("g")
      .attr("class", "title")
      .attr("transform", `translate(${svgBarMargin.left},${svgBarMargin.top/4})`)
      .append("text")
        .text("Porcentaje de instancias en las que se mencionó el tema")

    svgBar.append("g")
      .attr("transform", `translate(${svgBarMargin.left},${svgBarHeight - svgBarMargin.top - svgBarMargin.bottom + 20})`)
      .call(xAxis)

    svgBar.append("g")
      .attr("transform", `translate(${svgBarMargin.left},0)`)
      .call(yAxis)
      .call(g => {
        g.selectAll(".tick line").remove()
        g.selectAll(".domain").remove()
      })

    let gBar = svgBar.selectAll(".bar-group")
      .data(d => [d])
      .join("g")
        .attr("class", ".bar-group")
        .attr("transform", `translate(${svgBarMargin.left},0)`)

    gBar.selectAll("line")
      .data(temasBar)
      .join("line")
        .attr("class", "line")
        .attr("x1", d => xScale(0))
        .attr("y1", (d, i) => yScale(i))
        .attr("x2", d => xScale(d.porcentaje) - xScale(0))
        .attr("y2", (d, i) => yScale(i));

    gBar.selectAll("circle")
      .data(temasBar)
      .join("circle")
        .attr("class", "circle")
        .attr("cx", d => xScale(d.porcentaje) - xScale(0))
        .attr("cy", (d, i) => yScale(i))
        .attr("stroke", d => cabildos.comisiones[d.comision].color)
        .attr("fill", "#F8F9FA")
        .attr("r", 6);

    gBar.selectAll("text")
      .data(temasBar)
      .join("text")
        .attr("class", "text")
        .attr("x", d => xScale(d.porcentaje) - xScale(0) + 10)
        .attr("y", (d, i) => yScale(i) + 4)
        .text(d => d.porcentaje + "%")

    if (cabildo[0].hasOwnProperty("rankings")) {
      details.selectAll(".ranking-title")
        .data(cabildo)
        .join("div")
          .attr("class", "ranking-title")
          .html(d => d.rankings.title);

      details.selectAll(".ranking-description")
        .data(cabildo)
        .join("div")
          .attr("class", "ranking-description")
          .html(d => d.rankings.description)

      details.selectAll(".ranking-image")
        .data(cabildo[0].rankings.images)
        .join("div")
        .attr("class", "ranking-images")  
        .html(d => `<img src=${d} />`)
    }

    let comisionesDiv = details.selectAll(".comision")
      .data(comisiones)
      .join("div")
        .attr("class", "comision")
        .attr("id", d => d.id)

    comisionesDiv.selectAll(".comision-title")
      .data(d => [d])
      .join("div")
        .attr("class", "comision-title")
        .html(d => cabildos.comisiones[d.id].longName)

    comisionesDiv.selectAll(".comision-description")
      .data(d => d.description !== "" ? [d] : [])
      .join("div")
        .attr("class", "comision-description")
        .html(d => d.description)

    let comisionWC = comisionesDiv.selectAll(".general-cloud-div")
      .data(d => d.hasOwnProperty("wordCloud") ? [d] : [])
      .join("div")
        .attr("class", "general-cloud-div")
        .each(d => {
          let sizeScale = d3.scaleLinear()
            .domain(d3.extent(d.wordCloud, w => w.frecuencia))
            .range([12, 81])
          d.wordCloud.forEach(w => {
            w.fontSize = sizeScale(w.frecuencia)
          })
        })

    comisionWC.selectAll(".general-word-div")
      .data(d => d.wordCloud)
      .join("div")
        .attr("class", "general-word-div")
        .style("font-size", d => d.fontSize + "px")
        .style("line-height", d => 1.1 * d.fontSize + "px")
        .html(d => `${d.ngram}<sup>${d.frecuencia}</sup>`)

    let temaDiv = comisionesDiv.selectAll(".tema")
      .data(d => d.children.filter(c => c.hasOwnProperty("wordCloud") || c.hasOwnProperty("wordTree")))
      .join("div")
        .attr("class", "tema")
        .attr("id", d => "t" + d.id)

    temaDiv.append("div")
      .attr("class", "tema-title")
      .html(d => cabildos.temas[d.id].longName)

    temaDiv.append("div")
      .attr("class", "tema-description")
      .html(d => d.description)

    // WORD CLOUD
    let cloudDiv = temaDiv.filter(d => d.hasOwnProperty("wordCloud"))
      .selectAll(".cloud-div")
      .data(d => [d])
      .join("div")
        .attr("class", "cloud-div")
        .each(d => {
          let sizeScale = d3.scaleLinear()
            .domain(d3.extent(d.wordCloud, w => w.frecuencia))
            .range([12, 81])
          d.wordCloud.forEach(w => {
            w.fontSize = sizeScale(w.frecuencia)
          })
        })

    cloudDiv.selectAll(".word-div")
      .data(d => d.wordCloud)
      .join("div")
        .attr("class", "word-div")
        .style("font-size", d => d.fontSize + "px")
        .style("line-height", d => 1.1 * d.fontSize + "px")
        .html(d => `${d.ngram}<sup>${d.frecuencia}</sup>`)

    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [words.pop()],
            lineNumber = 0,
            lineHeightText = 1.01 * lineHeight, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("0")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).text(line);
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineHeightText + "px").text(word);
          }
        }
      });
    }

    const padding = 0;
    const lineHeight = 14;

    // WORD TREE
    let treeSvg = temaDiv.filter(d => d.hasOwnProperty("wordTree"))
      .selectAll(".tree-svg")
      .data(d => d.wordTree)
      .join("svg")
        .each(d => {
          let treeRoot = d3.hierarchy(d);
          d.dx = 20;
          d.dy = 400 / (treeRoot.height + padding);
          d3.tree().separation((a,b) => (a.parent === b.parent ? 2.0 : 2.3) * a.depth).nodeSize([d.dx, d.dy])(treeRoot);
          d.tree = treeRoot;

          let x0 = Infinity,
              x1 = -x0,
              y0 = Infinity,
              y1 = -y0;
          d.tree.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
            if (d.y > y1) y1 = d.y;
            if (d.y < y0) y0 = d.y;
          })
          d.x1 = x1;
          d.x0 = x0;
          d.y1 = y1;
          d.y0 = y0;
          d.height = d.x1 - d.x0 + d.dx * 4;
        })
        .attr("class", "tree-svg")
        .attr("width", detailsWidth)
        .attr("height", d => d.height)

    const treeG = treeSvg.selectAll(".tree-group")
      .data(d => [d])
      .join("g")
        .attr("class", "tree-group")
        .attr("transform", d => `translate(${130},${-d.x0 + 10})`)

    treeG.selectAll("path")
      .data(d => d.tree.links())
      .join("path")
        .attr("fill", "none")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    let node = treeG.append("g")
      .selectAll("circle")
      .data(d => d.tree.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`)

    node.append("circle")
      .attr("r", 5);

    node.selectAll("text")
      .data(d => [d])
      .join("text")
        .attr("dy", "0.32em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .call(wrap, 370);

    temaDiv.selectAll(".word-network")
      .data(d => d.hasOwnProperty("wordNetwork") ? [d.wordNetwork] : [])
      .join("div")
        .attr("class", "word-network")
        .html(d => `<img src=${d} />`)

  }

  function syncDropdowns(d) {
    if (d.depth === 1) {
      let cabildoId = d.data.id;
      d3.select("#select-cabildo").node().value = cabildoId
      state.cabildo = cabildoId;
    } else {
      let cabildoId = d.parent.parent.data.id;
      d3.select("#select-cabildo").node().value = cabildoId
      state.cabildo = cabildoId;

      let comisionId = d.parent.data.id;
      d3.select("#select-comision").node().value = comisionId
      state.comision = comisionId;

      let temaId = d.data.id;
      d3.select("#select-tema").node().value = temaId
      state.tema = temaId;
    }
    updateOptions();
  }

  function showBubbles() {
    d3.select("#bubbles").style("display", "flex");
  }

  function hideBubbles() {
    d3.select("#bubbles").style("display", "none");
  }

  function showDetails() {
    d3.select("#cabildo-details").style("display", "flex");
  }

  function hideDetails() {
    d3.select("#cabildo-details").style("display", "none");
  }

  function reset() {
    state.showing = 'circles';
    state.cabildo = 'Todos';
    state.comision = 'Todas';
    state.tema = 'Todos';
    d3.select("#select-cabildo").node().value = state.cabildo;
    d3.select("#select-comision").node().value = state.comision;
    d3.select("#select-tema").node().value = state.tema;
    hideDetails();
    showBubbles();
    updateOptions();
    hideCircles();
  }

  d3.select("#title").on("click", () => {
    reset();
  })

  d3.select("#back-button").on("click", () => {
    reset();
  })

  d3.select("#up-button").on("click", () => {
    window.scroll(0, 0);
  })

  function scrollToElement(id){
    function findPos(obj) {
        var curtop = 0;
        if (obj.offsetParent) {
            do {
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        return curtop;
        }
    }
    window.scroll(0,findPos(document.getElementById(id)) - d3.select("#sticky").node().getBoundingClientRect().height);
  }

  const depth1 = root.descendants().filter(d => d.depth === 1);
  const delaunay = d3.Delaunay.from(depth1, d => isMobile ? d.x : d.y, d => isMobile ? d.y : d.x);
  const voronoi = delaunay.voronoi([- 1,- 1, width + 1, height + 1])
  const cells = depth1.map((d, i) => [d, voronoi.cellPolygon(i)]);

  const expandFactor = isMobile ? 1.0 : 1.3;
  const verticalOffset = isMobile ? 0 : 120;
  const horizontalOffset = isMobile ? 0 : (d3.select("#cabildos").node().getBoundingClientRect().width - svgWidth)/2;

  const node = svg.append("g")
    .style("transform", `translate(${nodeYOffset}px, -${offset}px)`)
    .selectAll("circle")
    .data(root.descendants().slice(1).filter(d => d.depth === 1 || d.depth === 3))
    .join("circle")
      .attr('stroke', d => d.depth === 3 ? cabildos.comisiones[d.data.comision].color : null)
      .attr('stroke-width', 1.0)
      .attr("fill", d => "#EAEAEA")
      .attr("cx", d => isMobile ? d.x : expandFactor * d.y + horizontalOffset)
      .attr("cy", d => isMobile ? d.y : expandFactor * d.x - verticalOffset)
      .attr("r", d => expandFactor * d.r)
      .on("click", (event, d) => {
        state.showing = 'details';
        let cabildo = d.depth === 1 ? d.data.id : d.parent.parent.data.id
        hideBubbles();
        syncDropdowns(d);
        showDetails();
        updateDiv(cabildo); //updateDiv(d.cabildo);
        if (d.depth === 3 && (d.data.hasOwnProperty("wordCloud") || d.data.hasOwnProperty("wordTree") || d.data.hasOwnProperty("wordNetwork"))) {
          scrollToElement("t" + d.data.id)
        }
      })
      .on("mouseover", (event, d) => {
        if (d.depth === 1) {
          svg.selectAll("circle").filter(c => {
            return (c.depth === 1 && c.data.id === d.data.id) || (c.depth === 3 && c.parent.parent.data.id === d.data.id)
          })
          .attr("fill", "darkgray");
        } else if (d.depth === 3) {
          d3.select(event.target).attr("stroke-width", 2.0);
        }
      })
      .on("mouseout", (event, d) => {
        if (d.depth === 1) {
          svg.selectAll("circle").filter(c => {
            return (c.depth === 1 && c.data.id === d.data.id) || (c.depth === 3 && c.parent.parent.data.id === d.data.id)
          })
          .attr("fill", "#EAEAEA");
        } else if (d.depth === 3) {
          d3.select(event.target).attr("stroke-width", 1.0);
        }

      })

  const orient = ({
    top: (text, radius) => {
      let rect = text.node().getBoundingClientRect();
      return text.attr("text-anchor", "middle").attr("x", 0).attr("y", - radius - rect.height/2)
    },
    right: (text, radius) => {
      let rect = text.node().getBoundingClientRect();
      return text.attr("text-anchor", "start").attr("x", radius + rect.width/2).attr("y", 0)
    },
    bottom: (text, radius) => {
      let rect = text.node().getBoundingClientRect();
      return text.attr("text-anchor", "middle").attr("x", 0).attr("y", radius + rect.height)
    },
    left: (text, radius) => {
      let rect = text.node().getBoundingClientRect();
      return text.attr("text-anchor", "end").attr("x", - radius - rect.width/2).attr("y", 0)
    }
  })

  const label = svg.append("g")
      .selectAll(".label")
      .data(cells)
      .join("text")
        .attr("class", "label")
        .style("stroke-width", 0)
        .style("opacity", 0.8)
        .text(([d]) => d.data.name)
        .each(function([d, cell]) {
          const x = isMobile ? d.x : d.y;
          const y = isMobile ? d.y : d.x;
          const [cx, cy] = d3.polygonCentroid(cell);
          d.angle = (Math.round(Math.atan2(cy - y, cx - x) / Math.PI * 2) + 4) % 4;
          d3.select(this).call(d.angle === 0 ? orient.right
              : d.angle === 3 ? orient.top
              : d.angle === 1 ? orient.bottom
              : orient.left, expandFactor * d.r);
        })
        .attr("transform", ([d]) => `translate(${expandFactor * d.y + horizontalOffset}, ${expandFactor * d.x - verticalOffset})`);

  const lineHeight = 14;

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [words.pop()],
          lineNumber = 0,
          lineHeightText = 1.01, // ems
          x = text.attr("x"),
          y = text.attr("y"),
          dy = parseFloat(text.attr("0")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).text(line);
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * 1.01 * lineHeight + "px").text(word);
        }
      }
      let rectHeight = text.node().getBoundingClientRect().height;
      if (lineNumber > 1) text.attr("transform", `translate(0, ${-rectHeight/4})`);
    });
  }

  const nodeLabel = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("transform", `translate(0, -${offset}px)`)
    .selectAll(".node-label")
    .data(root.descendants().slice(1).filter(function(d) { return !d.children; }))
    .join("text")
      .attr("class", "node-label")
      .attr("x", d => isMobile ? d.x : expandFactor * d.y + horizontalOffset)
      .attr("y", d => isMobile ? d.y : expandFactor * d.x - verticalOffset)
      .style('fill', d => cabildos.comisiones[d.data.comision].color)
      .style("fill-opacity", 1)
      .style("display", "inline")
      .text(d => d.r > rMin ? cabildos.temas[d.data.id].shortName : null)
      .call(wrap, 30);

})
