<?php

$url = "none";
$title = "none";
$desc = "none";

$id = $_POST['id'];
mysql_query("SELECT user FROM users WHERE id = " . $id);

function getUrl(): string {
    return $url;
}

function getTitle(): string {
    return $title;
}

function getDesc(): string {
    return $desc;
}

function getLog(): string {
    $filter = $_COOKIE['filter'];
    return exec("cat /var/log/apache2/access.log | grep " . $filter);
}
?>