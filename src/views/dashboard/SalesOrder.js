import { CButton, CCol, CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle, CFormCheck, CFormInput, CFormSelect, CInputGroup, CInputGroupText, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateRangePicker } from 'rsuite'
import ExportModel from 'src/components/Models/ExportModel'
import RecordDeleteModel from 'src/components/Models/RecordDeleteModel'
import { predefinedRanges } from 'src/data/preDefinedDateRanges'
import 'rsuite/styles/index.less'; // or 'rsuite/dist/rsuite.min.css'
import "rsuite/dist/rsuite.min.css"
import SendEmailModel from 'src/components/Models/SendEmailModel'
import PinRequiredModel from 'src/components/Models/PinRequiredModel'
import SalesOrderServices from 'src/services/SalesOrderServices'
import moment from 'moment'
import CustomersServices from 'src/services/CustomersServices'
import LoadingModel from 'src/components/Models/LoadingModel'
import swal from 'sweetalert'
import NoData from 'src/extra/NoData/NoData'
import { PAGES } from 'src/hooks/constants'

const SalesOrder = () => {
    const [loading, setLoading] = useState(false)
    const [loadingMsg, setLoadingMsg] = useState(null)

    const [visible, setVisible] = useState(false)
    const [deleteVisible, setDeleteVisible] = useState(false)
    const [visiblePinModel, setVisiblePinModel] = useState(true)

    const [startDate, setStartDate] = useState(new Date().setMonth(new Date().getMonth() - 4))
    const [endDate, setEndDate] = useState(new Date())
    const [selectedOrderStatus, setSelectedOrderStatus] = useState(-1)
    const [salesOrderList, setSalesOrderList] = useState([]);

    const salesOrderListRef = useRef();

    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const pageSizes = [10, 25, 50];

    salesOrderListRef.current = salesOrderList;

    const [isSalesOrderList, setSalesOrderListState] = useState(false);
    const [isCheckingApi, setCheckingApi] = useState(false);
    const [customers, setCustomers] = useState([])
    const [searchTitle_Type, setSearchTitle_Type] = useState("");

    const [updateOnRefReshPage, setUpdateOnRefreshPage] = useState(0);
    useEffect(() => {
        retrievePlyWoodProductionList()
        getCustomerDetails()
    }, [page, pageSize, updateOnRefReshPage, selectedOrderStatus])


    const onChangeSearchTitle_Type = (e) => {
        const searchTitle = e.target.value;
        setSearchTitle_Type(searchTitle);

        var isSearchEmpty = searchTitle.trim().length ? false : true;

        if (isSearchEmpty) {
            setPage(1);
            retrievePlyWoodProductionList();
            setUpdateOnRefreshPage(Math.random());

            ////console.log("Search is empty type ...!! ");
        }

        ////console.log("Search input changing type -> ", searchTitle);
    };

    const findByTitle = () => {
        setPage(1);
        retrievePlyWoodProductionList();
        getCustomerDetails()
    };

    const getRequestParams = (searchTitle_Type, page, pageSize) => {
        let params = {};

        if (searchTitle_Type) {
            params["title_type"] = searchTitle_Type;
        }

        if (page) {
            params["page"] = page - 1;
        }

        if (pageSize) {
            params["size"] = pageSize;
        }

        return params;
    };

    const handleDateRangeOptions = (val) => {
        //console.log("Date Range handling-> ", val);
        console.log(val)
        setStartDate(val[0])
        setEndDate(val[1])
    };

    const bulkOrdersOptions = [
        { label: "Pending", value: 0 },
        { label: "Delivered", value: 1 },
        { label: "Canceled", value: 2 },
    ];
    const [bulkOrdersOptionData, setbulkOrdersOptionData] = useState(
        bulkOrdersOptions.value
    );
    const bulkOrdersActions = (val) => {
        setbulkOrdersOptionData(val.value);

        ////console.log(val.value, bulkOrdersOptionData);
    };

    const getCustomerDetails = () => {
        CustomersServices.getAllCustomersInfo("dash_page", 0, 10, "")
            .then(response => {

                // const customer = response.data.customersList.find(obj => obj.id === Number(item.Orders_Data_TB.customerId));
                setCustomers(response.data.customersList)

            })
    }

    const getCustomerName = (id) => {
        const customer = customers.find(obj => obj.id === Number(id));
        return customer.name
    }

    const retrievePlyWoodProductionList = async () => {
        setLoading(true)
        setLoadingMsg("Fetching Sales Orders...")
        setCheckingApi(true);

        const params = getRequestParams(searchTitle_Type, page, pageSize);

        var page_req = Number(params.page);
        var size_req = Number(params.size);
        var title_type_req = params.title_type
            ? params.title_type.toString().trim()
            : "";

        var startTime = moment(startDate).format("YYYY-MM-DD HH:mm:ss");
        var endTime = moment(endDate).format("YYYY-MM-DD HH:mm:ss");

        var page_role_type = "dash_page";

        await SalesOrderServices.getSalesList(
            page_role_type,
            page_req,
            size_req,
            title_type_req,
            startTime,
            endTime,
            Number(selectedOrderStatus)
        ).then(
            (response) => {
                //////console.log("Productions  list-> ", response);

                const { salesList, totalPages } = response.data;

                // //console.log(" Sales list -> ", response.data);

                if (salesList.length) {
                    var revsalesList = salesList;//.reverse();

                    setSalesOrderList(revsalesList);

                    setSalesOrderListState(true);
                }

                setCount(totalPages);

                setCheckingApi(false);
                setLoading(false)
                setLoadingMsg(null)
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                ////console.log("login in error ", resMessage);
                setSalesOrderListState(false);
                setSalesOrderList([]);
                setCheckingApi(false);
                setLoading(false)
                setLoadingMsg(null)
                if (error.response.data.message != "No Sales Order data found")
                    swal("Error!", error.response.data.message, "error");
            }
        );
    };

    let titlesObject = {
        h1: " No Sales Orders Found. ",
        h2: " All time ",
        h3: " Add a new record by simply clicking the button on top right side",
    };

    var noDataContent = (
        <>
            <NoData Titles={titlesObject} />
        </>
    );

    const navigate = useNavigate();

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return visiblePinModel ? <PinRequiredModel isNavigate={true} page={PAGES.SALES_ORDER} visible={visiblePinModel} onClose={(val) => setVisiblePinModel(val)} isNavigation={true} /> : (
        <>
            <CRow>
                <CCol>

                    <span style={{ fontSize: "1.5em", fontWeight: "bold" }}>Sales Orders</span>
                </CCol>
                <CCol className='d-flex justify-content-end gap-4'>
                    <CCol md={5}>
                        <CInputGroup >
                            <CFormInput className='default-border' aria-label="Amount (to the nearest dollar)" placeholder='Customer name / Order no' onChange={onChangeSearchTitle_Type} />
                            <CInputGroupText className='default-border' style={{ cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" onClick={findByTitle}>
                                    search
                                </span></CInputGroupText>
                        </CInputGroup>
                    </CCol>
                    <CCol >
                        <CButton
                            role="button"
                            className='blue-button'
                            style={{ width: "100%" }}
                            variant="outline"
                            onClick={() => setVisible(true)}
                        ><span className="material-symbols-outlined pt-1" style={{ fontSize: "1.1em" }}>
                                download
                            </span>{' '}Export</CButton>
                    </CCol>
                    <CCol>
                        <CButton
                            color="success"
                            className='default-border'
                            variant="outline"
                            style={{ fontSize: "1em", fontWeight: '600', width: "100%" }}
                            onClick={() => navigate('/sales/new')}><span className="material-symbols-outlined pt-1" style={{ fontSize: "1.1em" }}>
                                add
                            </span>{' '}New</CButton>
                    </CCol>
                </CCol>
            </CRow>

            <CRow className='mt-3'>
                <CCol md={2}>
                    <CFormSelect className='default-border' aria-label="Default select example">
                        <option>None</option>
                        <option value="delete">Delete Selected</option>
                        <option value="export">Export Selected</option>
                    </CFormSelect>
                </CCol>
                <CCol md={1}>
                    <CButton className='blue-button' style={{ width: "100%" }} color="primary" variant="outline" >Apply</CButton>
                </CCol>
                <CCol md={2}>
                    <DateRangePicker
                        ranges={predefinedRanges}
                        style={{ width: "100%" }}
                        placeholder="Date"
                        format="yyyy-MM-dd HH:mm:ss"
                        onOk={handleDateRangeOptions}
                        onChange={handleDateRangeOptions}
                        defaultCalendarValue={[new Date('2023-01-01 00:00:00'), new Date()]}
                    />

                </CCol>
                <CCol md={1}>
                    <CButton className='blue-button' style={{ width: "100%" }} color="primary" variant="outline" onClick={() => retrievePlyWoodProductionList()}>Filter</CButton>
                </CCol>
                <CCol md={2}>
                    <CFormSelect onChange={(e) => setSelectedOrderStatus(e.target.value)} className='default-border' aria-label="Default select example">
                        <option value={-1}>Order Status</option>
                        <option value={0}>PENDING</option>
                        <option value={1}>INVOICED</option>
                        <option value={2}>CANCELED</option>
                    </CFormSelect>
                </CCol>
                <CCol md={1}>
                    <CButton className='blue-button' style={{ width: "100%" }} color="primary" variant="outline" >Filter</CButton>
                </CCol>

                <CCol className="d-flex justify-content-end">
                    <CRow>
                        <CCol>
                            <CButton
                                disabled={page == 1}
                                className='blue-button'
                                style={{ width: "100%" }}
                                color="primary"
                                variant="outline"
                                onClick={() => setPage(page - 1)} >
                                Prev
                            </CButton>
                        </CCol>
                        <CCol>
                            <span style={{ color: "#2F5597", fontWeight: "bold" }} className='mt-1'>{page} of {count}</span>
                        </CCol>
                        <CCol>

                            <CButton
                                className='blue-button'
                                style={{ width: "100%" }}
                                color="primary"
                                variant="outline"
                                onClick={() => setPage(page + 1)}
                                disabled={page == count}
                            >
                                Next
                            </CButton>
                        </CCol>


                    </CRow>
                </CCol>
            </CRow>

            {/* Table */}
            {!isSalesOrderList ? noDataContent :
                <CRow className='p-2 mt-4'>
                    <CTable striped>
                        <CTableHead>
                            <CTableRow color="info">
                                <CTableHeaderCell scope="col" className='text-center' width={5}><CFormCheck id="flexCheckDefault" /></CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center'>Order #</CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center'>Date</CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center'>Customer Name</CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center'>Order Status</CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center'>Amount</CTableHeaderCell>
                                <CTableHeaderCell scope="col" className='text-center' width={100}>Action</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {salesOrderList?.map((item, index) => (
                                <CTableRow key={index}>
                                    <CTableDataCell className='text-center'><CFormCheck id="flexCheckDefault" /></CTableDataCell>
                                    <CTableHeaderCell scope="row" className='text-center' style={{ color: "blue", fontWeight: "800" }}>#SO{item.sop}</CTableHeaderCell>
                                    <CTableDataCell className='text-center'>{moment(item.order_date).format("YYYY-MM-DD")} </CTableDataCell>
                                    <CTableDataCell className='text-center'>{getCustomerName(item?.customerId)}</CTableDataCell>
                                    <CTableDataCell className='text-center'>{item.order_status == 0 ? "PENDING" : item.order_status == 1 ? "INVOICED" : "CANCELED"}</CTableDataCell>
                                    <CTableDataCell className='text-center'>LKR {numberWithCommas(Number(item.order_sub_chargers).toFixed(2))}</CTableDataCell>
                                    <CTableDataCell className='d-flex justify-content-around'>
                                        <span className="material-symbols-outlined" style={{ cursor: "pointer" }}
                                            onClick={() => navigate(`/sales/view?id=${item.id}&sop=SO${item.sop}`)}>
                                            visibility
                                        </span>
                                        <span className="material-symbols-outlined" style={{ cursor: "pointer" }} onClick={() => setDeleteVisible(true)}>
                                            delete
                                        </span>
                                    </CTableDataCell>
                                </CTableRow>
                            ))}



                        </CTableBody>
                    </CTable>
                </CRow>
            }
            <CRow>
                <CCol md={1}></CCol>
                <CCol className="d-flex justify-content-end" >
                    <CRow>
                        <CCol>

                            <CDropdown style={{ width: "100%" }} variant="btn-group" direction="dropup" >
                                <CDropdownToggle style={{ backgroundColor: '#fff' }} color="secondary">{pageSize}</CDropdownToggle>
                                <CDropdownMenu>
                                    {pageSizes.map((item, key) => (
                                        <CDropdownItem key={key} value={item} onClick={() => setPageSize(item)}>{item}</CDropdownItem>
                                    ))}
                                </CDropdownMenu>
                            </CDropdown>
                        </CCol>
                        <CCol>
                            <CButton
                                disabled={page == 1}
                                className='blue-button'
                                style={{ width: "100%" }}
                                color="primary"
                                variant="outline"
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </CButton>
                        </CCol>
                        <CCol>
                            <span style={{ color: "#2F5597", fontWeight: "bold" }} className='mt-1'>{page} of {count}</span>
                        </CCol>
                        <CCol>

                            <CButton
                                className='blue-button'
                                style={{ width: "100%" }}
                                color="primary"
                                variant="outline"
                                onClick={() => setPage(page + 1)}
                                disabled={page == count}>
                                Next
                            </CButton>
                        </CCol>


                    </CRow>

                </CCol>
            </CRow>
            <RecordDeleteModel page={PAGES.SALES_ORDER} visible={deleteVisible} onClose={(val) => setDeleteVisible(val)} recordId={"#5765"} />
            {/* <SendEmailModel visible={visible} onClose={(val) => setVisible(val)} recordId={"#5765"}/> */}
            <ExportModel visible={visible} onClose={(val) => setVisible(val)} />
            <LoadingModel visible={loading} loadingMsg={loadingMsg} onClose={(val) => setLoading(false)} />
        </>
    )
}

export default SalesOrder