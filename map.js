var width = 960;
var height = 500;
var state_data = new Object();
var target_state = 1;
var hover_state = -1;

var color = d3.scale.pow(5)
    .domain([.25, 4])
    .range(["#b2974e", "#4e8ab2"]);

var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
    return  "A voter in <i>" + state_data[d.id].name +
            "</i> is the same as <br><span style=\"color: #ff2222;\">" + Math.floor(state_data[d.id].rel_power * 100) / 100.0 + 
            "</span> voter" + (state_data[d.id].rel_power == 1 ? "" : "s") + " in <i>" + state_data[target_state].name + "</i>.";
  });

function stroke(d) {
  if(d.id == target_state) {
    d3.select(this).moveToFront();
    return "#000000";
  }
  if(d.id == hover_state) {
    d3.select(this).moveToFront();
    return "#222222";
  }
  return "#ffffff";
}

svg.call(tip);

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.csv("state_data.csv", function(d) {
    return {
      id: parseInt(d.id),
      code: d.code,
      name: d.name,
      pop: parseInt(d.pop),
      votes: parseInt(d.votes),
      power: parseInt(d.pop) / parseInt(d.votes)
    };
  }, initialize);

function calculateRelativeVoterPower(target) {
  target_state = target;
  var target_power = state_data[target_state].power;
  for(var i in state_data) {
    state_data[i].rel_power = target_power / state_data[i].power;
  }
}

function initialize(data) {
  for(var i in data) {
    state_data[data[i].id] = data[i];
    delete state_data[data[i].id].id;
  }
  calculateRelativeVoterPower(26);

  d3.json("us.json", function(error, us) {
    if (error) throw error;

    svg.selectAll(".state")
      .data(topojson.feature(us, us.objects.states).features.filter(function(d) {
        return d.id <= 56;
      }), function(d) { return d.id; })
      .enter().insert("path", ".graticule")
      .attr("class", "state")
      .attr("d", path)
      .style("fill", function(d) {
        return color(state_data[d.id].rel_power);
      })
      .style("stroke", stroke)
      .on("click", function(d) {
        calculateRelativeVoterPower(d.id);
        update();
        tip.hide(d);
        tip.show(d);
      })
      .on('mouseover', function(d) {
        hover_state = d.id;
        update();
        tip.show(d);
      })
      .on('mouseout', function(d) {
        if(hover_state == d.id) {
          hover_state = -1;
          update();
        }
        tip.hide(d);
      });
  });
}

function update() {
  svg.selectAll(".state")
    .attr("d", path)
    .style("fill", function(d) {
      return color(state_data[d.id].rel_power);
    })
    .style("stroke", stroke);
}