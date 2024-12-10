/**
 * ※※TODO※※
 * 見た目ブラッシュアップ 
 * タブキー移動順修正
 * 回答保存機能（問題削除ボタンで特定の問題を消すと回答が残る、溜まる可能性あり）
 * （ブラウザの問題削除で回答が全消しになる、間違えてブラウザの問題削除を押して直後ブラウザに保存を押しても
 * 回答は消えたままになってしまう、模範解答がストレージになければ初期表示時に回答は自動で消されるので
 * ブラウザの問題削除ボタンで回答を消す必要はないかも）
 * 処理共通化（localStorage周り）
 */
 
$(document).ready(function() {

	const localStorageKey = 'quizAppData';
	const localStorageKeyAnswer = 'quizAppAnswer'

	// 答え合わせボタン非表示
	$('.btn-comp').css('display', 'none');
	$('.btn-reset').css('display', 'none');
	// 初期表示（localStorageの値取得）
	initLocalStorage();


	// 初期表示（localStorageの値取得）
	function initLocalStorage() {
		// localStorageからデータ取得
		var quizAppData = JSON.parse(localStorage.getItem(localStorageKey));

		// localStorageデータ存在確認
		if (quizAppData) {
			// カテゴリー数取得
			var categoryCount = Object.keys(quizAppData);

			categoryCount.forEach(function(categoryName, index) {
				// 新しいIDの算出
				var newTabId = 'section' + (index + 1);

				// カテゴリータブ作成
				$('.category-new').val(categoryName);
				createCategoryTab(categoryName, newTabId);

				// コンテンツエリア作成
				createContentArea(categoryName, newTabId);
				// ダイアログの入力欄初期化
				$('.category-new').val('');

				// 登録されている問題をセット
				var questionContainer = $('#question-area-container-' + (index + 1));
				var questionList = quizAppData[categoryName];
				for (var questionNum in questionList) {
					// 問題を作成
					questionAdd(questionContainer);
					// 正解をセット
					$('#correct-' + (index + 1) + '-' + questionNum).val(questionList[questionNum]);
				}

				// 先頭カテゴリーを表示する
				if (index == 0) {
					$('.btn-category').attr('data-state', 'active');
					$('#' + newTabId).show();
				}
			});
		}

		// localStorageに保存されていない回答がある場合削除
		var quizAppAnswer = JSON.parse(localStorage.getItem(localStorageKeyAnswer));
		// localStorageデータ存在確認
		if (quizAppAnswer) {
			Object.keys(quizAppAnswer).forEach(key => {
				if (!quizAppData.hasOwnProperty(key)) {
					delete quizAppAnswer[key];
				}
			});
			// 保存しているデータが空になった場合、ストレージの情報削除（キーが残ってしまう対応策）（回答）
			if (quizAppAnswer && Object.keys(quizAppAnswer).length === 0) {
				localStorage.removeItem(localStorageKeyAnswer);
				quizAppAnswer = null;
			} else {
				// localstorageに保存
				localStorage.setItem(localStorageKeyAnswer, JSON.stringify(quizAppAnswer));
			}
		}

		// localStorage保存されている回答を復元
		// localStorageデータ存在確認
		if (quizAppAnswer) {
			// カテゴリー数取得
			var categoryCount = Object.keys(quizAppAnswer);

			categoryCount.forEach(function(categoryName, index) {
				// sectionIdの算出
				var sectionId = $("h3.category-title")
					.filter(function() {
						// カテゴリー名の値が一致する要素をフィルタリング
						return $(this).text() === categoryName;
					})
					.closest(".content-item")
					.attr("id");
				var sectionNum = sectionId.match(/\d+/); // 数字部分を抽出

				// 登録されている回答をセット
				var answerList = quizAppAnswer[categoryName];
				for (var answerNum in answerList) {
					$('#answer-' + sectionNum + '-' + answerNum).val(answerList[answerNum]);
				}
			});
		}

	}

	$(document).on('click', '.btn-category', function() {
		// 全てのボタンのdata-stateをinactiveに設定
		$('.btn-category').attr('data-state', 'inactive');
		// クリックされたボタンにdata-stateをactiveに設定
		$(this).attr('data-state', 'active');

		// 全てのボタンのdata-stateをinactiveに設定
		$('.content-item').hide();
		// data-target属性から対象のコンテンツ表示
		var target = $(this).data('target');
		$(target).show();		
	});

	var currentTitleElement; // 編集中のh3要素を保持するための変数

	// モーダルを開くボタンのクリックイベント
	$(document).on('click', '.open-dialog', function() {
		var target = $(this).data('target'); // data-target属性からモーダルのIDを取得
		$(target).css('display', 'flex').hide().fadeIn(200,function() {
			$(this).find('.dialog-input').focus(); // モーダル内の入力欄にフォーカス
		});

		// 対象のh3要素を取得
		currentTitleElement = $(this).siblings('.category-title');
		// モーダルの入力欄に現在のカテゴリー名を設定
		$('.category-update').val(currentTitleElement.text());
	});

	// モーダルを閉じるボタン（×）のクリックイベント
	$('.dialog .close').click(function() {
		$(this).closest('.dialog').fadeOut(200, function() {
			$(this).css('display', 'none'); // フェードアウト後に非表示
		});
	});

	// モーダルの背景部分をクリックしたときにモーダルを閉じる
	$('.dialog').click(function(e) {
		if ($(e.target).is('.dialog')) {
			$(this).fadeOut(200, function() {
				$(this).css('display', 'none'); // フェードアウト後に非表示
			});
		}
	});

	// ESCキーでモーダルを閉じる
	$(document).keydown(function(e) {
		if (e.key === "Escape") { // ESCキーが押されたかチェック
			$('.dialog').fadeOut(200, function() {
				$(this).css('display', 'none'); // フェードアウト後に非表示
			});
		}
	});

	// + > カテゴリー追加ボタンのクリックイベント（カテゴリー追加）
	$('.btn-category-add').click(function() {

		// 新しいIDの算出
		var newTabCount = ($('.btn-category').length + 1);
		var newTabId = 'section' + newTabCount;

		// カテゴリータブ作成
		createCategoryTab(newTabCount, newTabId);

		// コンテンツエリア作成
		createContentArea(newTabCount, newTabId);

		// ダイアログの入力欄初期化
		$('.category-new').val('');

		// ダイアログの入力欄にフォーカス
		$('.category-new').focus();
	});

	// btn-categoryを複製
	function createCategoryTab(newTabCount, newTabId) {

		var newTabState;
	
		if (newTabCount == 1) {
			// 1つ目のカテゴリーの場合のみactiveセット
			newTabState = 'active';
			// newTabSelected = true;
		} else {
			newTabState = 'inactive';
			// newTabSelected = false;
		}
		// 新しいタブボタンを追加
		var newTab = $('<button>', {
			type: 'button',
			role: 'tab',
			tabindex: newTabCount - 1,
			class: 'btn-category btn-category-tab',
			'data-state': newTabState,
			'data-target': '#' + newTabId,
			text: $('.category-new').val()
		});

		// 複製した要素を+ボタンの前に追加
		$('.btn-category-tab-add').before(newTab);
	}

	// contentを複製
	function createContentArea(newTabCount, newTabId) {
		//content数取得
		var contentCount = $('.content-item').length;

		// クローンして新しい問題エリアを作成
		var newContent = $('#content-template').clone();
		// question-area-containerおよび他の要素のIDを更新
		var uniqueId ='question-area-container-' + contentCount;
		newContent.find('#question-area-container').attr('id', uniqueId);
		newContent.attr('id', newTabId); // クローンのIDを設定
		if (newTabCount == 1) {
			newContent.show(); // 非表示を解除
		} else {
			newContent.hide(); // 非表示を解除
		}

		// ラベルやその他のユニークな識別子も更新
		newContent.find('.question-title label').each(function (index) {
			var labelFor = 'correct-' + contentCount + '-' + (index + 1);
			$(this).attr('for', labelFor);
			$(this).text('問題 ' + (index + 1));
		});

		newContent.find('input[name="correct"]').each(function (index) {
			var inputId = 'correct-' + contentCount + '-' + (index + 1);
			$(this).attr('id', inputId);
			$(this).attr('name', inputId);
		});
		newContent.find('input[name="answer"]').each(function (index) {
			var inputId = 'answer-' + contentCount + '-' + (index + 1);
			$(this).attr('id', inputId);
			$(this).attr('name', inputId);
		});

		// ラベルと入力欄の名前を更新
		newContent.find('label').text('問題 1');
		newContent.find('h3').text($('.category-new').val());

		// 問題エリアのテンプレートID振り直し
		newContent.find('#question-template').removeAttr('id');

		// コンテナに追加
		$('#content-container').append(newContent);
	}

	// モード切替ボタンのクリックイベント
	$('input[name="toggleButton"]').change(function(){
		var hasError = 0;

		// カテゴリーの必須チェック
		var tabList = $('.btn-category').length;
		if (tabList == 0) {
			hasError = 1;
		}

		// 正解の入力チェック
		var activeSection = $('.content-item').filter(function () {
			return $(this).css('display') !== 'none';
		});
		var correctList = activeSection.find('.dialog-correct');
		$.each(correctList, function(index, correct) {
			var value = $(correct).val();
			if (value == '' || !value.match(/[^\s\t]/)) {
				// 必須チェック
				hasError = 2;
				return false;
			}
		});

		if (hasError > 0) {
			var errorMessage;
			if (hasError == 1) {
				errorMessage = 'カテゴリーを作成してください'
			} else {
				errorMessage = '正解を全て入力してください'
			}
			alert(errorMessage);
			$(this).prop('checked', false);
			return false;
		}


		if($(this).prop('checked')) {
			// チェック有（ON：回答モード）
			$('.category-list').hide();
			$('#modeArea').css('justify-content', 'right');
			$('.btn-detail').hide();
			$('.dialog-correct').hide();
			$('.dialog-answer').show();
			$('.btn-add').hide();
			$('.btn-comp').show();
			$('.btn-reset').show();
			$('.btn-local-save').hide();
			$('.btn-local-delete').hide();
			$('.btn-delete').hide();
			$('.scoring-results-num').show();
			$('.scoring-results').show();
			$('.results-rate').show();
			$('.results-rate-per').show();
			$('.results-mark').show();
		} else {
			// チェック無（OFF：問題登録モード）
			$('.category-list').show();
			$('#modeArea').css('justify-content', 'space-between');
			$('.btn-detail').show();
			$('.dialog-correct').show();
			$('.dialog-answer').hide();
			$('.btn-add').show();
			$('.btn-comp').hide();
			$('.btn-reset').hide();
			$('.btn-local-save').show();
			$('.btn-local-delete').show();
			$('.btn-delete').show();
			$('.btn-delete-init').hide();
			$('.scoring-results-num').hide();
			$('.scoring-results').hide();
			$('.results-rate').hide();
			$('.results-rate-per').hide();
			$('.results-mark').hide();
		}
	});

	// 編集 > カテゴリー名更新ボタンのクリックイベント（カテゴリー編集）
	$('.btn-category-update').click(function() {
		var activeSection = $('.content-item').filter(function () {
			return $(this).css('display') !== 'none';
		});

		var oldCategoryName = activeSection.find('.category-title').text();
		var newCategoryName = $('.category-update').val();

		// タブリストのカテゴリー名更新
		$('[data-target="#' + activeSection.attr('id') + '"]').text(newCategoryName);
		// カテゴリーエリアのタイトルのカテゴリー名更新
		activeSection.find('.category-title').text(newCategoryName);

		// localStorageのカテゴリー名更新
		// localStorageからデータ取得
		var quizAppData = JSON.parse(localStorage.getItem(localStorageKey));
		var quizAppAnswer = JSON.parse(localStorage.getItem(localStorageKeyAnswer));

		// localStorageデータ存在確認（模範解答）
		if (quizAppData && quizAppData[oldCategoryName]) {

			// 変更対象のカテゴリー取得
			var categoryData = quizAppData[oldCategoryName];

			// 変更前のカテゴリーを削除
			delete quizAppData[oldCategoryName];

			// 変更後のカテゴリー追加
			quizAppData[newCategoryName] = categoryData;

			// 更新されたデータを再びlocalStorageに保存
			localStorage.setItem(localStorageKey, JSON.stringify(quizAppData));
		}
		// localStorageデータ存在確認（回答）
		if (quizAppAnswer && quizAppAnswer[oldCategoryName]) {

			// 変更対象のカテゴリー取得
			var categoryData = quizAppAnswer[oldCategoryName];

			// 変更前のカテゴリーを削除
			delete quizAppAnswer[oldCategoryName];

			// 変更後のカテゴリー追加
			quizAppAnswer[newCategoryName] = categoryData;

			// 更新されたデータを再びlocalStorageに保存
			localStorage.setItem(localStorageKeyAnswer, JSON.stringify(quizAppAnswer));
		}

		// モーダル非表示
		$(this).closest('.dialog').fadeOut(200, function() {
			$(this).css('display', 'none'); // フェードアウト後に非表示
		});
	});

	// 編集 > カテゴリー削除ボタンのクリックイベント（カテゴリー編集）
	$('.btn-category-danger').click(function() {
		if (confirm('対象のカテゴリーを削除してもよろしいでしょうか？')) {
			var activeSection = $('.content-item').filter(function () {
				return $(this).css('display') !== 'none';
			});

			// タブリスト削除
			$('[data-target="#' + activeSection.attr('id') + '"]').remove();
			// コンテンツ削除
			activeSection.remove();

			// localStorageから削除
			var deleteCategory = activeSection.find('.category-title').text();
			deleteLocalStorage(deleteCategory);
	
			// セクションのID全て振り直し
			// カテゴリータブのdata-target振り直し
			var tabList = $('.btn-category');
			$.each(tabList, function(index, tab) {
				// data-targetにはdataメソッドを使用して値をセットしないとキャッシュに反映しない
				// attrだけだどDOM上でしか書き換わらないのでキャッシュとDOM上両方書き換え
				$(tab).data('target', '#section' + (index + 1)).attr('data-target', '#section' + (index + 1));
				$(tab).attr('tabindex', index);
			});

			var sectionList = $('[id^="section"]');
			$.each(sectionList, function(index, section) {
				// sectionID振り直し
				$(section).attr('id', 'section' + (index + 1))
				// question-area-containerID振り直し
				var container = $(section).find('[id^="question-area-container"]');
				container.attr('id', 'question-area-container' + (index + 1));
				// 問題のID振り直し
				var questionList = container.find('.question-area');
				$.each(questionList, function(index2, question) {
					var correctId = (index + 1) + '-' + (index2 + 1);
					// ラベル
					$(question).find('.question-title label').attr('for', 'correct-' + correctId);
					// 入力欄
					$(question).find('input[name^="correct"]').attr('id', 'correct-' + correctId).attr('name', 'correct-' + correctId);
					$(question).find('input[name^="answer"]').attr('id', 'answer-' + correctId).attr('name', 'answer-' + correctId);
				});

			});

			// 先頭のカテゴリーを表示
			var firstSection = $('[id^="section"]').first();
			// クリックされたボタンにdata-stateをactiveに設定
			$('[data-target="#' + firstSection.attr('id') + '"]').attr('data-state', 'active');
			firstSection.show();

			// モーダル非表示
			$(this).closest('.dialog').fadeOut(200, function() {
				$(this).css('display', 'none'); // フェードアウト後に非表示
			});
		} else {
			// キャンセル
			return false;
		}
	});

	// 問題を追加ボタンのクリックイベント
	$(document).on('click', '.btn-add', function() {

		var questionContainer = $(this).siblings('[id^="question-area-container"]');
		questionAdd(questionContainer);
	});

	// 問題を追加
	function questionAdd(questionContainer) {
		// 既存の問題数を取得
		var questionCount = questionContainer.find('.question-area').length + 1;

		if (questionCount == 1) {
			// 1問目の場合、問題エリアを表示
			var questionAreaFirst = questionContainer.find('.question-template-area').first();
			questionAreaFirst.removeClass('question-template-area');
			questionAreaFirst.addClass('question-area');

			//問題保存ボタン表示
			questionContainer.siblings('.btn-local-save').show();
			//問題削除ボタン表示
			questionContainer.siblings('.btn-local-delete').show();
			return true;
		}

		// 2問目以降は複製

		// question-areaを複製
		var newQuestionArea = questionContainer.find('.question-area').first().clone();
		var sectionId = questionContainer.closest('.content-item').attr('id');
		var sectionNum = sectionId.match(/\d+/); // 数字部分を抽出

		//question-areaに問題番号を設定
		newQuestionArea.addClass('areaNm' + questionCount);

		// 複製された問題のラベルと入力欄のIDを更新
		newQuestionArea.find('.question-title label').attr('for', 'correct-' + sectionNum +'-' + questionCount).text('問題 ' + questionCount);
		newQuestionArea.find('input[name^="correct"]').attr('id', 'correct-' + sectionNum + '-' + questionCount).attr('name', 'correct-' + sectionNum + '-' + questionCount).val('');
		newQuestionArea.find('input[name^="answer"]').attr('id', 'answer-' + sectionNum + '-' + questionCount).attr('name', 'answer-' + sectionNum + '-' + questionCount).val('');

		newQuestionArea.find('.results-mark').removeClass('correct-mark').removeClass('incorrect-mark').text('');

		// 削除ボタン表示
		newQuestionArea.find('button').removeClass('btn-delete-init').show();

		// 複製した要素をquestion-area-containerに追加
		questionContainer.append(newQuestionArea);
	}

	// 問題を削除ボタンのクリックイベント
	$(document).on('click', '.btn-delete', function() {
		// 削除するquestion-areaを取得
		var targetArea = $(this).closest('.question-area');
		var questionContainer = targetArea.closest('.question-area-container, [id^="question-area-container"]');

		targetArea.remove();

		// 残っているquestion-areaの番号を振り直す
		updateQuestionLabels(questionContainer);
	});

	// 全てのquestion-areaの番号を振り直す関数（labelとdiv:class）
	function updateQuestionLabels(questionContainer) {

		var sectionId = questionContainer.closest('.content-item').attr('id');
		var sectionNum = sectionId.match(/\d+/); // 数字部分を抽出

		questionContainer.find('.question-area').each(function(index) {
			var targetQuestionArea = $(this);

			// ラベル振り直し
			// targetQuestionArea.find('label').text('問題 ' + (index + 1));
			// 複製された問題のラベルと入力欄のIDを更新
			targetQuestionArea.find('.question-title label').attr('for', 'correct-' + sectionNum +'-' + (index + 1)).text('問題 ' + (index + 1));
			targetQuestionArea.find('input[name^="correct"]').attr('id', 'correct-' + sectionNum + '-' + (index + 1)).attr('name', 'correct-' + sectionNum + '-' + (index + 1));
			targetQuestionArea.find('input[name^="answer"]').attr('id', 'answer-' + sectionNum + '-' + (index + 1)).attr('name', 'answer-' + sectionNum + '-' + (index + 1));

			// クラス（areaNm）振り直し
			var classes = targetQuestionArea.attr('class').split(/\s+/);
			// 前方一致するクラスを削除
			$.each(classes, function(index, className) {
				if (index == 0) {
					return true;
				}
				if (className.startsWith('areaNm')) {
					targetQuestionArea.removeClass(className);
				}
			});
			if (index == 0) {
				return true;
			}
			targetQuestionArea.closest('.question-area').addClass('areaNm' + (index + 1));

			
		});

		// インデックスを再設定
		questionIndex = $('.question-area:hidden').length + 1;
	}

	// 答え合わせボタンのクリックイベント
	$(document).on('click', '.btn-comp', function() {
		var questionContainer = $(this).siblings('[id^="question-area-container"]');
		var answerList = questionContainer.find('.dialog-answer');

		var hasError = false;

		$.each(answerList, function(index, answer) {
			var value = $(answer).val();
			if (value == '' || !value.match(/[^\s\t]/)) {
				//必須チェック
				$(answer).addClass('alert');
				$(answer).attr('placeholder', '⚠ 回答を入力してください');
				hasError = true;
			} else {
				$(answer).removeClass('alert');
				$(answer).attr('placeholder', '回答を入力');
			}
		});

		if (!hasError) {
			// 採点処理実行
			runGradingProcess(questionContainer);
		}
	});

	// 採点処理
	function runGradingProcess(questionContainer) {
		var correctList = questionContainer.find('.dialog-correct'); 

		var questionCount = correctList.length; 
		var correctCount = 0;

		$.each(correctList, function(index, correctInput) {
			// IDから採番 '1-1', '1-2' など
			var correctId = $(correctInput).attr('id').replace('correct-', '');

			// 対応する answer を探す
			var answerInput = $('#answer-' + correctId);

			// 正解/不正解マークの表示エリアを取得
			var resultMark = $(answerInput).closest('.question-area').find('.results-mark');

			// correct と answer の比較処理
			if (answerInput.length > 0) {
				var correctValue = $(correctInput).val();
				var answerValue = $(answerInput).val();
	
				if (correctValue === answerValue) {
					// 正解の場合の処理（例: 正答マークを表示）
					// $(answerInput).removeClass('incorrect').addClass('correct');
					resultMark.text('◯  模範解答 : ' + correctValue);
					resultMark.removeClass('incorrect-mark').addClass('correct-mark');
					correctCount++;
				} else {
					// 不正解の場合の処理（例: 不正答マークを表示）
					resultMark.text('☓  模範解答 : ' + correctValue);
					resultMark.removeClass('correct-mark').addClass('incorrect-mark');
				}
			} else {
				console.log('対応する answer が見つかりません: ' + correctId);
			}

			// 採点結果表示
			var section = questionContainer.closest('.content-item');
			section.find('.scoring-results-num').text(correctCount);
			section.find('.scoring-results').text('/ ' + questionCount);
			section.find('.results-rate').text(' 正答率 ');
			section.find('.results-rate-per').text(Math.round(correctCount / questionCount * 100) + '%');
		});
	}

	// リセットボタンのクリックイベント
	$(document).on('click', '.btn-reset', function() {
		var questionContainer = $(this).siblings('[id^="question-area-container"]');
		var resultMarkList = questionContainer.find('.results-mark');

		//採点結果の削除
		var section = questionContainer.closest('.content-item');
		section.find('.scoring-results-num').text('');
		section.find('.scoring-results').text('');
		section.find('.results-rate').text('');
		section.find('.results-rate-per').text('');

		//正答マークの削除
		$.each(resultMarkList, function(index, resultMark) {
			$(resultMark).removeClass('correct-mark');
			$(resultMark).removeClass('incorrect-mark');
			$(resultMark).text('');
		});

		// 入力された値削除
		questionContainer.find('.dialog-answer').val('');

		// カテゴリー名取得
		var newCategory = questionContainer.siblings('.category-area').find('.category-title').text();
		// localStorageからデータ取得
		var quizAppAnswer = JSON.parse(localStorage.getItem(localStorageKeyAnswer));
		if (quizAppAnswer) {
			// localStorageに保存されている回答のカテゴリーを削除
			delete quizAppAnswer[newCategory];
			// localstorageに保存
			localStorage.setItem(localStorageKeyAnswer, JSON.stringify(quizAppAnswer));
		}
		// 保存しているデータが空になった場合、ストレージの情報削除（キーが残ってしまう対応策）（回答）
		if (quizAppAnswer && Object.keys(quizAppAnswer).length === 0) {
			localStorage.removeItem(localStorageKeyAnswer);
		}
	});

	// 問題保存ボタンのクリックイベント
	$(document).on('click', '.btn-local-save', function() {
		var questionContainer = $(this).siblings('[id^="question-area-container"]');

		// 正解の入力チェック
		var hasError = false;
		var correctList = questionContainer.find('.dialog-correct');
		$.each(correctList, function(index, correct) {
			var value = $(correct).val();
			if (value == '' || !value.match(/[^\s\t]/)) {
				//必須チェック
				hasError = true;
				alert('正解を全て入力してください');
				return false;
			}
		});

		// localStorageに保存
		if (!hasError) {
			saveLocalStorage(questionContainer);
		}

	});

	// カテゴリーと模範解答を保存する関数
	function saveLocalStorage(questionContainer) {
/**		localStorage構造
		問題アプリのデータ : {カテゴリー名 : {問題番号 : 模範解答}}
		quizAppData: {
						categoryName1: {
										questionNum1 : correct1,
										questionNum2 : correct2,
										questionNum3 : correct3
						},
						categoryName2: {
										questionNum1 : correct1,
										questionNum2 : correct2,
										questionNum3 : correct3
						}
		}
*/
		// カテゴリー名取得
		var newCategory = questionContainer.siblings('.category-area').find('.category-title').text();
		// 保存する問題リスト
		var newQuestionData = {};

		// localStorageからデータ取得
		var quizAppData = JSON.parse(localStorage.getItem(localStorageKey));

		// localStorageデータ存在確認
		if (!quizAppData) {
			quizAppData = {};
		}

		// localStorage保存対象のカテゴリー存在確認
		if (!quizAppData[newCategory]) {
			quizAppData[newCategory] = {}
		}

		// 保存する模範解答セット
		var correctList = questionContainer.find('.dialog-correct');
		$.each(correctList, function(index, correct) {
			newQuestionData[index+1] = $(correct).val();
		});

		// カテゴリー内の模範解答を更新
		quizAppData[newCategory] = newQuestionData;

		// localstorageに保存
		localStorage.setItem(localStorageKey, JSON.stringify(quizAppData));
	}

	// 問題削除ボタンのクリックイベント
	$(document).on('click', '.btn-local-delete', function() {
		var deleteCategory = $(this).siblings('.category-area').find('.category-title').text();

		// localStorageから削除
		deleteLocalStorage(deleteCategory);

	});

	// 対象のカテゴリーを削除する
	function deleteLocalStorage(deleteCategory) {
		// localStorageからデータ取得
		var quizAppData = JSON.parse(localStorage.getItem(localStorageKey));
		var quizAppAnswer = JSON.parse(localStorage.getItem(localStorageKeyAnswer));

		// localStorageデータ存在確認（模範解答）
		if (quizAppData && quizAppData[deleteCategory]) {
			// 対象のカテゴリーを削除
			delete quizAppData[deleteCategory];
			// 更新されたデータを再びlocalStorageに保存
			localStorage.setItem(localStorageKey, JSON.stringify(quizAppData));
		}
		// localStorageデータ存在確認（回答）
		if (quizAppAnswer && quizAppAnswer[deleteCategory]) {
			// 対象のカテゴリーを削除
			delete quizAppAnswer[deleteCategory];
			// 更新されたデータを再びlocalStorageに保存
			localStorage.setItem(localStorageKeyAnswer, JSON.stringify(quizAppAnswer));
		}

		// 保存しているデータが空になった場合、ストレージの情報削除（キーが残ってしまう対応策）（模範解答）
		if (quizAppData && Object.keys(quizAppData).length === 0) {
			localStorage.removeItem(localStorageKey);
		}
		// 保存しているデータが空になった場合、ストレージの情報削除（キーが残ってしまう対応策）（回答）
		if (quizAppAnswer && Object.keys(quizAppAnswer).length === 0) {
			localStorage.removeItem(localStorageKeyAnswer);
		}
	}

	// 入力された回答をlocalStorageに保存
	$(document).on('blur', '.dialog-answer', function() {
		const value = $(this).val();
		var deleteFlg = false;
		if (value == '' || !value.match(/[^\s\t]/)) {
			// return false;
			deleteFlg = true;
		}
		var questionContainer = $(this).closest('[id^="question-area-container"]');
		// カテゴリー名取得
		var categoryName = questionContainer.siblings('.category-area').find('.category-title').text();

		// 保存する回答の問題番号
		var answerNo = $(this).attr('id').match(/-(\d+)$/)[1];

		// localStorageからデータ取得
		var quizAppAnswer = JSON.parse(localStorage.getItem(localStorageKeyAnswer));

		if (!quizAppAnswer && deleteFlg) {
			return false;
		}

		// localStorageデータ存在確認
		if (!quizAppAnswer) {
			quizAppAnswer = {};
		}

		// localStorage保存対象のカテゴリー存在確認
		if (!quizAppAnswer[categoryName]) {
			quizAppAnswer[categoryName] = {}
		}
	
		// カテゴリー内の模範解答を更新
		if (deleteFlg) {
			delete quizAppAnswer[categoryName][answerNo];
		} else {
			quizAppAnswer[categoryName][answerNo] = value;
		}

		// 対象カテゴリーが殻になった場合、カテゴリー削除
		if (quizAppAnswer[categoryName] && Object.keys(quizAppAnswer[categoryName]).length === 0) {
			delete quizAppAnswer[categoryName];
		}

		// 保存しているデータが空になった場合、ストレージの情報削除（キーが残ってしまう対応策）（回答）
		if (quizAppAnswer && Object.keys(quizAppAnswer).length === 0) {
			localStorage.removeItem(localStorageKeyAnswer);
		} else {
			// localstorageに保存
			localStorage.setItem(localStorageKeyAnswer, JSON.stringify(quizAppAnswer));
		}
		
	});

});