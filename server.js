let mysql  = require('mysql');
bodyParser = require('body-parser'),
http = require('http'),
app = require('express')();
	
var pool = mysql.createPool({
     connectionLimit: 5,
     host: 'localhost',
     user: 'root',
     password: '', 
     database: 'test_db'
});

/*
CURRENT_PAGE = req.params.page || 1
ITEMS_PER_PAGE = 2
START_INDEX = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;

TOTAL_ITEMS = SELECT COUNT(*) FROM TABLE
TOTAL_PAGES = CEIL(TOTAL_ITEMS / ITEMS_PER_PAGE);

RESULTS = SELECT * FROM TABLE LIMIT START_INDEX, ITEMS_PER_PAGE;
*/
app.use(bodyParser.json());

app.get('/test/:page', function(req, res){
	
	var current_page = req.params.page || 1;
	if(current_page==0){
		res.json({"success" : false, "message" : "Invalid page."});
		return;
	}
	var items_per_page = 2;
	var start_index = (parseInt(current_page) - 1) * items_per_page;
	
	pool.getConnection(function(err, connection) {
				
		if(err){
			console.log('Database', err);
			res.json({"success" : false, "message" : "Something went wrong. Please try again later."});
		}else{
			
			let sql = "SELECT COUNT(*) total FROM tbl_players";
			connection.query(sql, function (err, result) {
				if (err){
					console.log("Query Error", err);
					res.json({"success" : false, "message" : err});
				}else{
					
					let total_items = result[0].total;
					
					let total_pages = Math.ceil(parseInt(total_items) / parseInt(items_per_page));
					
					var next_page = parseInt(current_page) + 1;
					if(next_page > total_pages){
						next_page = 0;
					}
					let sql = "SELECT id, player_name FROM tbl_players ORDER BY id desc LIMIT ?, ?";
					connection.query(sql,[start_index,items_per_page], function (err, result) {
						if (err){
							console.log("Query Error", err);
							res.json({"success" : false, "message" : err});
						}else{
							res.json({"success" : true, "next_page": next_page, "total_pages": total_pages, "data" : result});
						}
						
					});
					connection.release();
				}
				
			});
			
		}
	});
			
});

//create server
http.createServer(app).listen(3000, function () {
   console.log('Server started: Listening on port 3000');
});