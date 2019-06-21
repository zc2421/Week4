//reference:
//https://bl.ocks.org/micahstubbs/e4f5c830c264d26621b80b754219ae1b

$(function () {


    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const parseTime = d3.time.format("%Y-%m-%d").parse;
    // console.log(parseTime("2019-06-14"));
    const bisectDate = d3.bisector(d => d.date).left;


    const x = d3.time.scale()
        .range([0, width])

    const y = d3.scale.linear()
        .range([height, 0])


    const xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(6,0)
        .outerTickSize(0)
        .tickFormat(d3.time.format("%Y-%m-%d"));

    const yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    //date-close line
    const line = d3.svg.line()
        .x(function(d){return x(d.date); })
        .y(function(d){return y(d.close);});




    //render svg component
    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    //define x-axis
    const gX = svg.append("g")
        .attr("class", "axis axis--x")
        .attr('transform', `translate(0, ${height})`)

    //define y-axis
    const gY = svg.append("g")
        .attr("class", "axis axis--y")

    gY.append("text")
        .attr("x", 5)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font", "12px")
        .text("$close");


    //data
    d3.json("data.json", function(err, data){
        if (err) throw err;

        //data parsing

        data.sort((b, a) => a.date - b.date);

        data.forEach(function(d){
            d.date = parseTime(d.date);
            d.close = +d.close;
            d.volume = +d.volume;
        });

        //define axis domain
        x.domain([data[data.length - 1].date, data[0].date]);
        y.domain(d3.extent(data, d => d.close)).nice();



        //display volume data
        const volData = data.filter(d => d.volume !== null && d.volume !== 0);
        const yMinVol = d3.min(volData, d =>{
            return Math.min(d.volume);
        });
        const yMaxVol = d3.max(volData, d =>{
            return Math.max(d.volume);
        });

        const yVolumeScale = d3.scale.linear()
            .domain([yMinVol, yMaxVol])
            .range([height, margin.top]);




        //draw
        gX.call(xAxis);
        gY.call(yAxis);


        svg.append("path")
            .datum(data)
            .attr('class', 'line')
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);


        svg.selectAll()
            .data(volData)
            .enter()
            .append('rect')
            .attr('x', d =>{
                return x(d.date);
            })
            .attr('y', d =>{
                return yVolumeScale(d.volume);
            })
            .attr('fill', (d, i) => {
                if (i === 0) {
                    return '#03a678';
                } else {
                    return volData[i - 1].close > d.close ? '#c0392b' : '#03a678';
                }
            })
            .attr('width', 1)
            .attr('height', d => {
                return height - yVolumeScale(d['volume']);
            });




        //create pointer
        const focus = svg
            .append('g')
            .attr('class', 'focus')
            .style('display', 'none');
        focus.append('circle').attr('r', 4.5);
        focus.append('line').classed('x', true);
        focus.append('line').classed('y', true);

        svg.append('rect')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', () => focus.style('display', null))
            .on('mouseout', () => focus.style('display', 'none'))
            .on('mousemove', mousemove);

        d3.select('.overlay').style('fill', 'none');
        d3.select('.overlay').style('pointer-events', 'all');

        d3.selectAll('.focus line').style('fill', 'none');
        d3.selectAll('.focus line').style('stroke', '#67809f');
        d3.selectAll('.focus line').style('stroke-width', '1.5px');
        d3.selectAll('.focus line').style('stroke-dasharray', '3 3');



        function mousemove() {
            const x0 = x.invert(d3.mouse(this)[0]);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            // console.log(x0 - d0.date > d1.date - x0);
            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            focus.attr('transform', `translate(${x(d.date)}, ${y(d.close)})`);
            focus.select('line.x')
                .attr('x1', 0)
                .attr('x2', -x(d.date))
                .attr('y1', 0)
                .attr('y2', 0);

            focus.select('line.y')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', height - y(d.close));

            focus.select('text').text(d.close);
        }






    });



});