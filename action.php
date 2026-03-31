<?php
$conn = new mysqli("localhost", "root", "", "bucketlist");

// ADD
if (isset($_POST['add']))
    $conn->query("INSERT INTO goals (title, date) VALUES ('$_POST[title]', '$_POST[date]')");

// DELETE
if (isset($_POST['delete']))
    $conn->query("DELETE FROM goals WHERE id=$_POST[id]");

// COMPLETE
if (isset($_POST['complete']))
    $conn->query("UPDATE goals SET status='completed' WHERE id=$_POST[id]");

$result = $conn->query("SELECT * FROM goals ORDER BY id DESC");
?>

<!DOCTYPE html>
<html>
<head>
<style>
body {
    font-family: 'Segoe UI', sans-serif;
    background: #f3e8ff;
}

.card {
    background: white;
    padding: 12px;
    margin: 12px;
    border-radius: 12px;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.2);
}

.done {
    text-decoration: line-through;
    color: gray;
}

button {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-left: 5px;
    color: white;
    font-weight: bold;
}

/* Purple Done Button */
.done-btn {
    background: linear-gradient(45deg, #6a11cb, #8e2de2);
}

/* Pink/Purple Delete Button */
.delete-btn {
    background: linear-gradient(45deg, #ff416c, #ff4b2b);
}

.done-btn:hover {
    opacity: 0.85;
}

.delete-btn:hover {
    opacity: 0.85;
}
</style>
</head>

<body>

<?php
while ($row = $result->fetch_assoc()) {

    echo "<div class='card'>";

    echo ($row['status'] == 'completed') 
        ? "<span class='done'>$row[title]</span>" 
        : $row['title'];

    echo " - $row[date]";

    echo "
    <form method='POST' style='display:inline;'>
        <input type='hidden' name='id' value='$row[id]'>
        <button class='done-btn' name='complete'>✔ Done</button>
    </form>

    <form method='POST' style='display:inline;'>
        <input type='hidden' name='id' value='$row[id]'>
        <button class='delete-btn' name='delete'>❌ Delete</button>
    </form>
    ";

    echo "</div>";
}
?>

</body>
</html>