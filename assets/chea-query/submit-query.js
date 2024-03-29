//set CORS to call "appdemo" package on public server
ocpu.seturl("http://maayanlab.ocpu.io/chea3/R")

var sliderClassName = 'slider';
var chea3Results;


function sliderChange(event) {
    //change slider output text
    var outputId = `${event.target.id}_output`;
    document.getElementById(outputId).innerHTML = renderSliderValueString(event.target.value);
    recolorAllNodes();
}

function getColor(id){
    return ($("#"+id).spectrum('get').toHexString())
}

function recolorAllNodes(){
    //reset to gray
    nodes = document.querySelectorAll("circle");
    for(var n of nodes) {
        n.setAttribute("fill","gray");
    }

    //loop through sliders and colorpickers
    sliders = document.querySelectorAll(".slider");
    for (var s of sliders){
        var libraryName = s.id.replace('_slider', '');
        var colorpicker_id = libraryName + "_colorpicker";
        console.log(colorpicker_id)
        var set1Values = chea3Results[libraryName].map(function (transcriptionFactors) {

            return transcriptionFactors.set1.split('_')[0];

        });
        var set1ValuesSliderSubset = set1Values.splice(0, s.value);
        for (var tf of set1ValuesSliderSubset) {
            console.log(tf)
            node  = document.getElementById(tf);

            if(node){
                node.setAttribute("fill",getColor(colorpicker_id));
            }
        }

    }

}

function addSliderEventListeners() {
    var sliders = document.querySelectorAll(`.${sliderClassName}`);

    Array.from(sliders).forEach(function (slider) {
        slider.addEventListener('change', sliderChange);
    });
}

function renderSliderValueString(value) {
    return `Top ${value} TFs highlighted in network`;
}

function renderCaption(libraryName) {
    var captionId = `${libraryName}_${sliderClassName}`;
    var value = 0;

    return `
	<caption style="width:500%;font-weight:bold;padding-top:50px;padding-bottom:10px;font-size:medium">
		${libraryName}
		<span data-tooltip="library information text will go here" data-tooltip_position="right">
			<span class="mbri-info mbr-iconfont mbr-iconfont-btn"></span>
		</span>
		<input id="${captionId}" class="${sliderClassName}" type="range" min="0" max="50" value="${value}">
		<span id="${captionId}_output" style="font-weight:lighter;font-size:small,font-style:italic">
		  ${renderSliderValueString(value)}
		</span>	
		<input type='text' id="${libraryName}_colorpicker" />
	</caption>`;
}

function renderColorPicker(libraryName) {
    var colorpicker_id = libraryName + "_colorpicker";
    $("#"+colorpicker_id)
        .on('change', function() {
            recolorAllNodes();
        })
        .spectrum({
            color: "#4dca4f"
        });
}

function renderTable(libraryName) {
    return `
	<table class="display" style="width:30%" id="table_${libraryName}"></table>
	`
}

var buttonCommon = {
    exportOptions: {
        format: {
            body: function (data, column, row) {
                var filterData = data.replace(/&lt;/g, '<')
                return filterData.replace(/&gt;/g, '>');

            }
        }
    }
};


$(document).ready(function () {
    $('#example-genelist').on('click', function () {
        var gl = document.getElementById("genelist");
        gl.placeholder = "";
        jQuery.get('assets/chea-query/example_genelist.txt', function (data) {
            gl.value = data;
        });

    });


    $('#submit-genelist').on('click', function (evt) {

        $('#loading-screen').removeClass('d-none');



        var geneset = document.getElementById("genelist").value.split(/\n/);

        //send contents of text box to chea3 server
        var request = ocpu.call("queryCheaWeb",{
            geneset: geneset,
            set_name: "usergeneset"},
            function(session){
            session.getObject(function(data){
                chea3Results = JSON.parse(data);
                var lib_names = Object.keys(chea3Results);
                var results_div = document.getElementById("query-results");

                var captionAndTableMarkup = lib_names.reduce(function (accumlator, libraryName) {
                    accumlator += renderCaption(libraryName)
                    accumlator += renderTable(libraryName);

                    return accumlator;
                }, '');

                results_div.innerHTML += captionAndTableMarkup;

                for (var i = 0; i < lib_names.length; i++) {

                    renderColorPicker(lib_names[i]);

                    var lib_results = chea3Results[lib_names[i]];

                    $(`#table_${lib_names[i]}`).DataTable({
                        data: lib_results,
                        aoColumns: [
                            {mData: "rank", sTitle: "Rank"},
                            {mData: "set1", sTitle: "TF Gene Set", sWidth: "20em"},
                            {mData: "intersect", sTitle: "Intersection"},
                            {mData: "FET p-value", sTitle: "FET p-value"}],
                        scrollY: "100px",
                        scrollX: true,
                        scrollCollapse: true,
                        paging: false,

                        fixedColumns: true,
                        dom: "Bfrtip",
                        buttons: [
                            $.extend(true, {}, buttonCommon, {
                                extend: 'copyHtml5'
                            }),
                            $.extend(true, {}, buttonCommon, {
                                extend: 'excelHtml5'
                            }),
                            $.extend(true, {}, buttonCommon, {
                                extend: 'pdfHtml5'
                            }),
                            $.extend(true, {}, buttonCommon, {
                                extend: 'colvis'
                            })
                        ]
                    });
                    $("div.toolbar").html('<b>Custom tool bar! Text/images etc.</b>');


                }

                addSliderEventListeners();






                $('#loading-screen').addClass('d-none');



            });



        });


        //FAKE RESULTS -- USE OF
        // setTimeout(function () {
        //     $('#loading-screen').addClass('d-none');
        //     //remove tools
        //     document.getElementById("tfea-title").remove();
        //     document.getElementById('translucent-net').remove();
        //     document.getElementById("tfea-submission").remove();
        //
        //     //load fake results
        //     jQuery.get('assets/chea-query/example_results.json', function (results) {
        //         chea3Results = results;
        //         var lib_names = Object.keys(results);
        //         var results_div = document.getElementById("query-results");
        //
        //
        //         var captionAndTableMarkup = lib_names.reduce(function (accumlator, libraryName) {
        //             accumlator += renderCaption(libraryName)
        //             accumlator += renderTable(libraryName);
        //
        //             return accumlator;
        //         }, '');
        //
        //         results_div.innerHTML += captionAndTableMarkup;
        //
        //         for (i = 0; i < lib_names.length; i++) {
        //
        //             renderColorPicker(lib_names[i]);
        //
        //             var lib_results = results[lib_names[i]];
        //             var column_names = Object.keys(lib_results[1])
        //
        //             $(`#table_${lib_names[i]}`).DataTable({
        //                 data: lib_results,
        //                 aoColumns: [
        //                     {mData: "set1", sTitle: "TF Gene Set", sWidth: "20em"},
        //                     {mData: "intersect", sTitle: "Intersection"},
        //                     {mData: "FET p-value", sTitle: "FET p-value"}],
        //                 scrollY: "100px",
        //                 scrollX: false,
        //                 scrollCollapse: true,
        //                 paging: false,
        //
        //                 fixedColumns: true,
        //                 dom: "Bfrtip",
        //                 buttons: [
        //                     $.extend(true, {}, buttonCommon, {
        //                         extend: 'copyHtml5'
        //                     }),
        //                     $.extend(true, {}, buttonCommon, {
        //                         extend: 'excelHtml5'
        //                     }),
        //                     $.extend(true, {}, buttonCommon, {
        //                         extend: 'pdfHtml5'
        //                     }),
        //                     $.extend(true, {}, buttonCommon, {
        //                         extend: 'colvis'
        //                     })
        //                 ]
        //             });
        //             $("div.toolbar").html('<b>Custom tool bar! Text/images etc.</b>');
        //
        //
        //         }
        //
        //         addSliderEventListeners();
        //
        //     });
        //
        //
        // }, 1000);




    });
});



	